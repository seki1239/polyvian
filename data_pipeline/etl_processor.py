import json
import os

# Levenshtein距離の簡易実装
def levenshtein_distance(s1, s2):
    if len(s1) < len(s2):
        return levenshtein_distance(s2, s1)

    if len(s2) == 0:
        return len(s1)

    previous_row = range(len(s2) + 1)
    for i, c1 in enumerate(s1):
        current_row = [i + 1]
        for j, c2 in enumerate(s2):
            insertions = previous_row[j + 1] + 1
            deletions = current_row[j] + 1
            substitutions = previous_row[j] + (c1 != c2)
            current_row.append(min(insertions, deletions, substitutions))
        previous_row = current_row
    return previous_row[-1]

def select_best_sentence(word_id, ngsl_words, tatoeba_sentences, known_word_ids):
    """
    N+1理論に基づき、ターゲット単語以外が既知である例文を優先スコアリングして選定する。
    今回は簡単のため、ターゲット単語のみが例文に登場し、かつその単語がNGSLリストに存在することを「最適な例文」と見なす。
    より厳密な実装では、例文内の全単語を解析し、ターゲット単語以外がknown_word_idsに含まれるかを確認する。
    """
    target_word_str = next((w["word"] for w in ngsl_words if w["id"] == word_id), None)
    if not target_word_str:
        return None

    best_sentence = None
    best_score = -1

    for sentence in tatoeba_sentences:
        # 例文がターゲット単語を含むか確認
        if target_word_str.lower() in sentence["text"].lower():
            # 例文中の全ての単語を取得 (簡易的な単語分割)
            sentence_words = set(s.strip(".,!?\"'").lower() for s in sentence["text"].split() if s.strip(".,!?\"'"))

            # N+1理論の簡易実装: ターゲット単語が一つだけ含まれ、他の単語が既知であるか
            # ここでは、例文に含まれるNGSL単語が、ターゲット単語のみであるかをチェック
            # より高度な実装では、known_word_ids を活用し、未知語が1つのみかを判定する
            relevant_ngsl_words_in_sentence = [
                w for w in ngsl_words
                if w["word"].lower() in sentence_words and w["id"] != word_id
            ]

            # ターゲット単語のみが含まれている場合を高く評価
            if not relevant_ngsl_words_in_sentence:
                # ターゲット単語のみを含む例文は高スコア
                current_score = 2
            else:
                # 他のNGSL単語も含まれる場合は低スコア
                current_score = 1

            if current_score > best_score:
                best_score = current_score
                best_sentence = sentence

    return best_sentence

def etl_process(ngsl_path, tatoeba_path, output_path):
    with open(ngsl_path, 'r', encoding='utf-8') as f:
        ngsl_words = json.load(f)
    with open(tatoeba_path, 'r', encoding='utf-8') as f:
        tatoeba_sentences = json.load(f)

    processed_data = []
    word_map = {word["word"].lower(): word["id"] for word in ngsl_words}
    id_to_word_map = {word["id"]: word["word"] for word in ngsl_words}

    # 混乱マトリックス構築のための類似語IDリストを付与
    for i, word_data in enumerate(ngsl_words):
        similar_words_ids = []
        target_word = word_data["word"].lower()
        for other_word_data in ngsl_words:
            if word_data["id"] == other_word_data["id"]:
                continue
            
            # Levenshtein距離を計算し、閾値以下のものを類似語とする (ここでは例として距離が1または2)
            distance = levenshtein_distance(target_word, other_word_data["word"].lower())
            if distance <= 2 and distance > 0: # 距離が0より大きく、かつ2以下
                similar_words_ids.append(other_word_data["id"])
        
        word_data["similar_ids"] = sorted(list(set(similar_words_ids))) # 重複を削除してソート

        # N+1理論に基づいた例文選定
        # 現時点では全ての単語を既知として、N+1理論でターゲット単語を含む最適な例文を選ぶロジック
        # 簡易的に、ターゲット単語のみを含む、またはターゲット単語が主である例文を選ぶ
        known_word_ids = [w["id"] for w in ngsl_words if w["id"] != word_data["id"]] # 仮に自分以外の単語は全て既知とする
        
        # `select_best_sentence` 関数を呼び出す際に、`tatoeba_sentences` を渡す
        best_sentence_obj = select_best_sentence(word_data["id"], ngsl_words, tatoeba_sentences, known_word_ids)
        
        if best_sentence_obj:
            word_data["sentence"] = best_sentence_obj["text"]
        else:
            word_data["sentence"] = "" # 適切な例文が見つからない場合

        processed_data.append({
            "id": word_data["id"],
            "word": word_data["word"],
            "definition": word_data["definition"],
            "sentence": word_data["sentence"],
            "similar_ids": word_data["similar_ids"]
        })

    # 出力ディレクトリが存在しない場合は作成
    output_dir = os.path.dirname(output_path)
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)

    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(processed_data, f, ensure_ascii=False, indent=2)
    print(f"Processed data saved to {output_path}")

if __name__ == "__main__":
    # mock_data.pyが生成するJSONファイルのパス
    ngsl_mock_path = "data_pipeline/ngsl_mock.json"
    tatoeba_mock_path = "data_pipeline/tatoeba_mock.json"
    output_master_data_path = "frontend/src/assets/master_data.json"

    # mock_data.pyを実行してモックデータを生成
    # (ここでは直接Pythonスクリプトを実行するのではなく、ファイルが存在することを前提とするか、
    # 呼び出し側で先にmock_data.pyを実行しておく)
    # 実際には `python3 data_pipeline/mock_data.py` を先に実行する
    
    etl_process(ngsl_mock_path, tatoeba_mock_path, output_master_data_path)