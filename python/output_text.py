import numpy as np
import tensorflow as tf
from tensorflow.keras.models import load_model
from tensorflow.keras.preprocessing.sequence import pad_sequences
import pickle  # Untuk memuat tokenizer

# Muat model yang telah dilatih
model = load_model("translation_model.keras")

# Muat tokenizer dan parameter lainnya
with open("bugis_tokenizer.pkl", "rb") as f:
    bugis_tokenizer = pickle.load(f)

with open("indo_tokenizer.pkl", "rb") as f:
    indo_tokenizer = pickle.load(f)

max_len = np.load("max_len.npy", allow_pickle=True).item()

# **Ambil layer encoder**
encoder_inputs = model.input[0]
encoder_lstm = model.layers[4]
encoder_outputs, state_h, state_c = encoder_lstm.output
encoder_model = tf.keras.Model(encoder_inputs, [encoder_outputs, state_h, state_c])

# **Ambil layer decoder dengan attention**
latent_dim = 256
decoder_inputs = model.input[1]
decoder_state_input_h = tf.keras.layers.Input(shape=(latent_dim,))
decoder_state_input_c = tf.keras.layers.Input(shape=(latent_dim,))
decoder_states_inputs = [decoder_state_input_h, decoder_state_input_c]

dec_emb_layer = model.layers[3]
decoder_embedding = dec_emb_layer(decoder_inputs)
decoder_lstm = model.layers[5]
decoder_dense = model.layers[6]

decoder_outputs, state_h, state_c = decoder_lstm(decoder_embedding, initial_state=decoder_states_inputs)
decoder_states = [state_h, state_c]
decoder_outputs = decoder_dense(decoder_outputs)

decoder_model = tf.keras.Model([decoder_inputs] + decoder_states_inputs, [decoder_outputs] + decoder_states)

def decode_sequence_beam_search(input_text, beam_size=3):
    input_seq = bugis_tokenizer.texts_to_sequences([input_text])
    input_seq = pad_sequences(input_seq, maxlen=max_len, padding='post')

    encoder_out, state_h, state_c = encoder_model.predict(input_seq)

    start_token = indo_tokenizer.word_index.get('<start>', 1)
    end_token = indo_tokenizer.word_index.get('<end>', 2)

    sequences = [([start_token], 0.0, state_h, state_c)]
    
    for _ in range(max_len):
        all_candidates = []
        
        for seq, score, h, c in sequences:
            target_seq = np.zeros((1, 1))
            target_seq[0, 0] = seq[-1]

            output_tokens, h_new, c_new = decoder_model.predict([target_seq] + [h, c])

            top_k_probs = np.argsort(output_tokens[0, -1, :])[-beam_size:]

            for token in top_k_probs:
                new_seq = seq + [token]
                new_score = score + np.log(output_tokens[0, -1, token])
                all_candidates.append((new_seq, new_score, h_new, c_new))

        sequences = sorted(all_candidates, key=lambda x: x[1], reverse=True)[:beam_size]

        if all(seq[-1] == end_token for seq, _, _, _ in sequences):
            break

    best_seq = sequences[0][0]
    translated_sentence = [indo_tokenizer.index_word.get(token, "") for token in best_seq[1:-1]]
    
    return " ".join(translated_sentence)

# Contoh penggunaan
input_text = "pakessingiki batenu manre"
translated_text = decode_sequence_beam_search(input_text)
print(f"Bugis: {input_text} -> Indonesia: {translated_text}")
