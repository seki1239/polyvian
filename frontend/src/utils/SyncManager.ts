import { db, type ICard, type IReviewLog, type IUser, type ISyncQueue } from '../db/db';
import type { Table } from 'dexie';

interface SyncPayload {
  last_sync_time: string;
  sync_queue: ISyncQueue[];
}

interface SyncResponse {
  status: string;
  diff: {
    cards: ICard[];
    review_logs: IReviewLog[];
    users: IUser[];
  };
  new_sync_time: string;
}

export class SyncManager {
  private currentUserId: number | null = null; // 現在のユーザーIDを保持

  // コンストラクタからapiEndpointを削除し、内部で環境変数から取得するように変更
  constructor() {}

  private getApiEndpoint(): string {
    return import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
  }

  // 同期APIのフルURLを生成するヘルパーメソッド
  private getSyncApiUrl(): string {
    return `${this.getApiEndpoint()}/sync.php`;
  }

  /**
   * 同期処理を開始します。
   * 
   * @param userId 同期を実行するユーザーのID。必須。
   * @returns 同期が成功したかどうかを示す真偽値。
   */
  public async sync(userId: number): Promise<boolean> {
    if (!userId) {
      console.error("SyncManager: User ID is required for synchronization.");
      return false;
    }
    this.currentUserId = userId; // ユーザーIDをセット

    console.log("SyncManager: Starting synchronization...");

    try {
      // 1. localStorageから前回の同期時刻を取得
      const lastSyncTime = localStorage.getItem('last_sync_time_' + this.currentUserId) || '1970-01-01 00:00:00'; // 初回同期用

      // 2. IndexedDBのsync_queueテーブルから、未同期の変更ログを取得
      const syncQueue = await db.sync_queue.toArray();

      // 3. バックエンドのAPIエンドポイントにPOSTリクエストを送信
      const payload: SyncPayload = {
        last_sync_time: lastSyncTime,
        sync_queue: syncQueue,
      };

      console.log("SyncManager: Sending payload to backend:", payload);

      const token = localStorage.getItem('token');
      const headers: HeadersInit = {
          'Content-Type': 'application/json',
      };
      if (token) {
          headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(this.getSyncApiUrl(), { // apiEndpointの代わりにgetSyncApiUrl()を使用
        method: 'POST',
        headers: headers,
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: SyncResponse = await response.json();
      console.log("SyncManager: Received response from backend:", result);

      if (result.status === 'success') {
        // 4. サーバーからのレスポンス (diff) を受け取り、IndexedDBの各テーブルに反映
        await db.transaction('rw', db.cards, db.review_logs, db.users, db.sync_queue, async () => {
          // cardsテーブルの差分を反映
          if (result.diff.cards && result.diff.cards.length > 0) {
            await this.applyDiff(db.cards, result.diff.cards, this.currentUserId!);
          }
          // review_logsテーブルの差分を反映
          if (result.diff.review_logs && result.diff.review_logs.length > 0) {
            await this.applyDiff(db.review_logs, result.diff.review_logs, this.currentUserId!);
          }
          // usersテーブルの差分を反映
          if (result.diff.users && result.diff.users.length > 0) {
            await this.applyDiff(db.users, result.diff.users, this.currentUserId!);
          }

          // 5. 成功したら、送信済みのsync_queueレコードを削除し、新しいlast_sync_timeを保存
          const sentQueueIds = syncQueue.map(item => item.id!);
          if (sentQueueIds.length > 0) {
            await db.sync_queue.bulkDelete(sentQueueIds);
            console.log(`SyncManager: Deleted ${sentQueueIds.length} items from sync_queue.`);
          }

          localStorage.setItem('last_sync_time_' + this.currentUserId, result.new_sync_time);
          console.log("SyncManager: Synchronization successful. New last_sync_time saved:", result.new_sync_time);
        });
        return true;
      } else {
        console.error("SyncManager: Synchronization failed on server side:", result);
        return false;
      }
    } catch (error) {
      // 6. 通信エラー時は何もしない（次回に持ち越し）
      console.error("SyncManager: Synchronization failed due to network or server error:", error);
      return false;
    }
  }

  /**
   * サーバーからの差分データをIndexedDBに反映します。
   * サーバーからのデータにはis_deletedフラグが含まれていると仮定し、削除処理も行います。
   * 
   * @param table DexieのTableインスタンス
   * @param diffData 差分データ配列
   * @param currentUserId 現在のユーザーID
   */
  private async applyDiff<T extends { id?: number, user_id?: number, is_deleted?: boolean }>(
    table: Table<T, number>, 
    diffData: T[], 
    currentUserId: number
  ): Promise<void> {
    const itemsToAddOrUpdate: T[] = [];
    const itemIdsToDelete: number[] = [];

    for (const item of diffData) {
      if (item.user_id !== currentUserId) {
        continue; // 他のユーザーのデータはスキップ
      }

      if (item.is_deleted) {
        if (item.id !== undefined) {
          itemIdsToDelete.push(item.id);
        }
      } else {
        // created_atとupdated_atが文字列で返ってくる場合があるのでDateオブジェクトに変換
        if ('created_at' in item && typeof (item as any).created_at === 'string') {
          (item as any).created_at = new Date((item as any).created_at);
        }
        if ('updated_at' in item && typeof (item as any).updated_at === 'string') {
          (item as any).updated_at = new Date((item as any).updated_at);
        }
        if ('due_date' in item && typeof (item as any).due_date === 'string') {
          (item as any).due_date = new Date((item as any).due_date);
        }
        if ('last_review' in item && typeof (item as any).last_review === 'string') {
          (item as any).last_review = new Date((item as any).last_review);
        }
        if ('review_date' in item && typeof (item as any).review_date === 'string') {
          (item as any).review_date = new Date((item as any).review_date);
        }

        itemsToAddOrUpdate.push(item);
      }
    }

    if (itemsToAddOrUpdate.length > 0) {
      await table.bulkPut(itemsToAddOrUpdate);
      console.log(`SyncManager: Bulk put ${itemsToAddOrUpdate.length} items into ${table.name}.`);
    }
    if (itemIdsToDelete.length > 0) {
      await table.bulkDelete(itemIdsToDelete);
      console.log(`SyncManager: Bulk delete ${itemIdsToDelete.length} items from ${table.name}.`);
    }
  }
}