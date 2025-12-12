import json

def generate_mock_data():
    # NGSL形式の単語リスト（20語程度）
    # わざと「スペルが似ている単語（adapt/adopt）」や「意味が近い単語」を含める
    ngsl_words = [
        {"id": 1, "word": "apple", "definition": "果物の一種"},
        {"id": 2, "word": "banana", "definition": "細長い黄色い果物"},
        {"id": 3, "word": "adapt", "definition": "適応させる"},
        {"id": 4, "word": "adopt", "definition": "採用する、養子にする"},
        {"id": 5, "word": "affect", "definition": "影響を与える"},
        {"id": 6, "word": "effect", "definition": "影響、効果"},
        {"id": 7, "word": "elicit", "definition": "引き出す"},
        {"id": 8, "word": "illicit", "definition": "不法な"},
        {"id": 9, "word": "complement", "definition": "補完する"},
        {"id": 10, "word": "compliment", "definition": "褒める"},
        {"id": 11, "word": "desert", "definition": "砂漠、見捨てる"},
        {"id": 12, "word": "dessert", "definition": "デザート"},
        {"id": 13, "word": "principle", "definition": "原則"},
        {"id": 14, "word": "principal", "definition": "主要な、校長"},
        {"id": 15, "word": "stationary", "definition": "静止した"},
        {"id": 16, "word": "stationery", "definition": "文房具"},
        {"id": 17, "word": "site", "definition": "場所、敷地"},
        {"id": 18, "word": "cite", "definition": "引用する"},
        {"id": 19, "word": "sight", "definition": "視力、光景"},
        {"id": 20, "word": "bear", "definition": "クマ、耐える"},
    ]

    # Tatoeba形式の例文リスト（50文程度）
    tatoeba_sentences = [
        {"id": 101, "text": "I like to eat an apple every day.", "word_ids": [1]},
        {"id": 102, "text": "Bananas are a good source of potassium.", "word_ids": [2]},
        {"id": 103, "text": "You must adapt to the new environment.", "word_ids": [3]},
        {"id": 104, "text": "They decided to adopt a child.", "word_ids": [4]},
        {"id": 105, "text": "The changes will affect everyone.", "word_ids": [5]},
        {"id": 106, "text": "The effect of the medicine was immediate.", "word_ids": [6]},
        {"id": 107, "text": "Her questions were designed to elicit a response.", "word_ids": [7]},
        {"id": 108, "text": "He was involved in an illicit affair.", "word_ids": [8]},
        {"id": 109, "text": "The colors complement each other well.", "word_ids": [9]},
        {"id": 110, "text": "He gave her a compliment on her dress.", "word_ids": [10]},
        {"id": 111, "text": "The desert can be a harsh place.", "word_ids": [11]},
        {"id": 112, "text": "We had fruit as dessert.", "word_ids": [12]},
        {"id": 113, "text": "It's against my principles to lie.", "word_ids": [13]},
        {"id": 114, "text": "The principal reason is cost.", "word_ids": [14]},
        {"id": 115, "text": "The car remained stationary.", "word_ids": [15]},
        {"id": 116, "text": "I need to buy some stationery.", "word_ids": [16]},
        {"id": 117, "text": "This is a good site for a new building.", "word_ids": [17]},
        {"id": 118, "text": "He cited several examples.", "word_ids": [18]},
        {"id": 119, "text": "The sight of the ocean was beautiful.", "word_ids": [19]},
        {"id": 120, "text": "A bear can be dangerous.", "word_ids": [20]},
        {"id": 121, "text": "She learned to adapt quickly.", "word_ids": [3]},
        {"id": 122, "text": "The company decided to adopt a new policy.", "word_ids": [4]},
        {"id": 123, "text": "Smoking can affect your health.", "word_ids": [5]},
        {"id": 124, "text": "The ripple effect spread widely.", "word_ids": [6]},
        {"id": 125, "text": "His speech failed to elicit any applause.", "word_ids": [7]},
        {"id": 126, "text": "They were engaged in illicit trade.", "word_ids": [8]},
        {"id": 127, "text": "The new curtains complement the room.", "word_ids": [9]},
        {"id": 128, "text": "She paid him a compliment.", "word_ids": [10]},
        {"id": 129, "text": "He deserted his post.", "word_ids": [11]},
        {"id": 130, "text": "What's for dessert?", "word_ids": [12]},
        {"id": 131, "text": "He lives by his principles.", "word_ids": [13]},
        {"id": 132, "text": "The principal of the school gave a speech.", "word_ids": [14]},
        {"id": 133, "text": "The car was stationary for a long time.", "word_ids": [15]},
        {"id": 134, "text": "I bought some new stationery for school.", "word_ids": [16]},
        {"id": 135, "text": "The construction site is busy.", "word_ids": [17]},
        {"id": 136, "text": "Please cite your sources.", "word_ids": [18]},
        {"id": 137, "text": "He lost his sight in the accident.", "word_ids": [19]},
        {"id": 138, "text": "I saw a bear in the woods.", "word_ids": [20]},
        {"id": 139, "text": "Eating an apple a day keeps the doctor away.", "word_ids": [1]},
        {"id": 140, "text": "She eats a banana for breakfast.", "word_ids": [2]},
        {"id": 141, "text": "It's hard to adapt to a new culture.", "word_ids": [3]},
        {"id": 142, "text": "They chose to adopt a healthier lifestyle.", "word_ids": [4]},
        {"id": 143, "text": "The weather can affect your mood.", "word_ids": [5]},
        {"id": 144, "text": "The special effects were amazing.", "word_ids": [6]},
        {"id": 145, "text": "The detective tried to elicit information.", "word_ids": [7]},
        {"id": 146, "text": "Illegal activities are considered illicit.", "word_ids": [8]},
        {"id": 147, "text": "His skills complement hers.", "word_ids": [9]},
        {"id": 148, "text": "She received a compliment on her work.", "word_ids": [10]},
        {"id": 149, "text": "The army deserted the city.", "word_ids": [11]},
        {"id": 150, "text": "Chocolate cake is my favorite dessert.", "word_ids": [12]},
    ]

    return ngsl_words, tatoeba_sentences

if __name__ == "__main__":
    ngsl, tatoeba = generate_mock_data()
    with open("data_pipeline/ngsl_mock.json", "w", encoding="utf-8") as f:
        json.dump(ngsl, f, ensure_ascii=False, indent=2)
    with open("data_pipeline/tatoeba_mock.json", "w", encoding="utf-8") as f:
        json.dump(tatoeba, f, ensure_ascii=False, indent=2)
    print("Mock data generated: ngsl_mock.json and tatoeba_mock.json in data_pipeline directory.")
