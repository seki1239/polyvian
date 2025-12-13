// frontend/src/db/db.ts
import Dexie, { type Table } from 'dexie';
import { type Card as FsrsCard, Rating, State, createEmptyCard } from 'ts-fsrs';
import masterData from '../assets/master_data.json'; // 生成されたJSONデータをインポート

// master_data.json の型定義
interface MasterDataItem {
  id: number;
  word: string;
  definition: string;
  sentence: string;
  similar_ids?: number[];
  similar_words_ids?: number[]; // 古い形式の可能性を考慮
}

// カードの状態
export type CardState = State; // ts-fsrsのState型を使用

// 同期ステータス
export type SyncStatus = 'synced' | 'pending';

// IndexedDBのテーブル構造を定義
export interface IUser {
  id?: number; // IndexedDBでは++idで自動インクリメントされる
  username: string;
  password_hash?: string; // バックエンドから常に返されるとは限らないためオプショナルに
  created_at: Date;
  updated_at: Date;
}

export interface ICard {
  id?: number; // IndexedDBでは++idで自動インクリメントされる
  user_id: number;
  word: string;
  definition: string;
  sentence: string; // 例文
  similar_ids: number[]; // 類似語IDリスト
  due_date: Date;
  // FSRSパラメータ
  // FSRS: Flexible Spaced Repetition Scheduler
  // 参照: https://github.com/open-spaced-repetition/ts-fsrs/blob/main/src/type.ts
  stability: number;
  difficulty: number;
  elapsed_days: number;
  scheduled_days: number;
  learning_steps: number; // FSRSパラメータ
  reps: number;
  lapses: number;
  state: CardState;
  last_review?: Date;
  created_at: Date;
  updated_at: Date;
  sync_status: SyncStatus; // 同期状態を管理
  isInterleaving?: boolean; // インターリービングフラグ
}

export interface IReviewLog {
  id?: number; // IndexedDBでは++idで自動インクリメントされる
  card_id: number;
  user_id: number;
  review_date: Date;
  rating: Rating; // 1: Again, 2: Hard, 3: Good, 4: Easy
  elapsed_days: number;
  scheduled_days: number;
  state: CardState;
  due_date: Date;
  sync_status: SyncStatus; // 同期状態を管理
}

export interface ISyncQueue {
  id?: number; // IndexedDBでは++idで自動インクリメントされる
  table_name: 'cards' | 'review_logs' | 'users'; // 同期対象のテーブル名
  operation: 'add' | 'update' | 'delete'; // 操作タイプ
  payload: any; // 同期対象のデータ（JSON形式）
  timestamp: Date; // キューに追加された時刻
}

// Dexieデータベースのインスタンスを作成
class PolyvianDB extends Dexie {
  users!: Table<IUser, number>;
  cards!: Table<ICard, number>;
  review_logs!: Table<IReviewLog, number>;
  sync_queue!: Table<ISyncQueue, number>;

  constructor() {
    super('PolyvianDB');
    this.version(2).stores({
      users: '++id, username', // idは自動インクリメント、usernameはユニーク
      cards: '++id, user_id, word, [user_id+due_date], [user_id+state], sync_status', // id, user_id, word, 複合インデックス [user_id+due_date], [user_id+state], sync_status
      review_logs: '++id, card_id, user_id, sync_status', // id, card_id, user_id, sync_status
      sync_queue: '++id, table_name, operation', // id, table_name, operation
    });

    this.on('populate', async () => {
      // データベースが初めて作成されるときの初期データ挿入
      await this.seedDatabase();
    });
  }

  // 初期データを投入するシード関数
  async seedDatabase() {
    console.log("Seeding database...");
    const now = new Date();

    // ユーザーが存在しない場合のみ作成
    let user = await this.users.where('username').equals('demo_user').first();
    if (!user) {
      const userId = await this.users.add({
        username: 'demo_user',
        password_hash: 'hashed_password_for_demo', // モックなので仮の値
        created_at: now,
        updated_at: now,
      });
      user = { id: userId, username: 'demo_user', password_hash: 'hashed_password_for_demo', created_at: now, updated_at: now };
      console.log(`Demo user created with ID: ${userId}`);
    }

    // カードデータが存在しない場合のみ作成
    if ((await this.cards.count()) === 0 && user?.id) {
      const currentUserId: number = user.id; // user.id が number であることを保証
      const initialCards = masterData.map((data: MasterDataItem) => {
        // FSRSの初期カード状態を設定
        const fsrsCard: FsrsCard = createEmptyCard(now);
        return {
          id: data.id, // ★ここを追加！JSONのIDを強制的に使用する
          user_id: currentUserId,
          word: data.word,
          definition: data.definition, // master_data.jsonからの定義
          sentence: data.sentence,     // master_data.jsonからの例文
similar_ids: data.similar_words_ids || data.similar_ids || [], // master_data.jsonからの類似語ID。古い形式にも対応。
          due_date: fsrsCard.due,
          stability: fsrsCard.stability,
          difficulty: fsrsCard.difficulty,
          elapsed_days: fsrsCard.elapsed_days,
          scheduled_days: fsrsCard.scheduled_days,
          reps: fsrsCard.reps,
          lapses: fsrsCard.lapses,
          learning_steps: fsrsCard.learning_steps,
          state: fsrsCard.state,
          last_review: fsrsCard.last_review,
          created_at: now,
          updated_at: now,
          sync_status: 'synced' as SyncStatus,
        };
      });

      await this.cards.bulkAdd(initialCards);
      console.log(`${initialCards.length} cards added from master_data.json.`);
    } else {
      console.log("Database already contains data or user ID is missing, skipping seeding.");
    }
  }
}

export const db = new PolyvianDB();