// frontend/src/utils/AudioController.ts

interface Window {
  webkitAudioContext?: typeof AudioContext;
}

class AudioController {
  private synth: SpeechSynthesis;
  private voices: SpeechSynthesisVoice[] = [];
  private selectedVoice: SpeechSynthesisVoice | null = null;
  private isIOS: boolean;
  private audioContext: AudioContext | null = null;
  private silentTrackSource: AudioBufferSourceNode | null = null;

  constructor() {
    this.synth = window.speechSynthesis;
    this.isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent); // MSStreamは削除

    if (this.synth) {
      this.synth.onvoiceschanged = () => {
        this.voices = this.synth.getVoices();
        this.selectHighQualityVoice();
      };
      // For some browsers, voices might already be loaded
      if (this.synth.getVoices().length > 0) {
        this.voices = this.synth.getVoices();
        this.selectHighQualityVoice();
      }
    } else {
      console.warn('Web Speech API (SpeechSynthesis) is not supported in this browser.');
    }

    if (this.isIOS) {
      this.initializeIOSAudioContext();
    }
  }

  private selectHighQualityVoice() {
    const preferredVoices = ['Google', 'Siri', 'Premium']; // 優先するボイスのキーワード
    const englishVoices = this.voices.filter(voice => voice.lang.startsWith('en-'));

    for (const keyword of preferredVoices) {
      const foundVoice = englishVoices.find(voice => voice.name.includes(keyword));
      if (foundVoice) {
        this.selectedVoice = foundVoice;
        console.log(`Selected voice: ${this.selectedVoice.name}`);
        return;
      }
    }

    // 優先ボイスが見つからない場合、最初の英語ボイスを選択
    if (englishVoices.length > 0) {
      this.selectedVoice = englishVoices[0];
      console.log(`Selected default English voice: ${this.selectedVoice.name}`);
    } else {
      console.warn('No English voices found, falling back to any available voice or null.');
      // デフォルトの'en-US'を優先的に選択する
      this.selectedVoice = this.voices.find(voice => voice.lang === 'en-US') || this.voices[0] || null;
      if (this.selectedVoice) {
        console.log(`Fallback voice selected: ${this.selectedVoice.name}`);
      } else {
        console.warn('No voices available at all.');
      }
    }
  }

  private initializeIOSAudioContext() {
    // iOSでの音声再生を有効にするためのAudioContext初期化
    // ユーザーインタラクションがないとAudioContextがresumeされないため、
    // 最初のユーザー操作時にこれを呼び出す必要がある
    window.addEventListener('touchstart', () => {
      if (!this.audioContext || this.audioContext.state === 'suspended') {
        // window.webkitAudioContext を型ガードで安全に使用
        this.audioContext = new (window.AudioContext || window.webkitAudioContext!)();
        this.audioContext.resume().then(() => {
          console.log('AudioContext resumed on iOS.');
          this.playSilentTrack(); // Silent track to keep audio alive
        }).catch(error => console.error('Error resuming AudioContext:', error));
      }
    }, { once: true });
  }

  private playSilentTrack(forceNew = false) {
    if (!this.isIOS || !this.audioContext) return;

    // 無音の短いオーディオバッファを作成し再生する
    // forceNewがtrueの場合、既存のsilentTrackSourceがあっても新しいものを生成
    if (this.audioContext.state === 'running' && (forceNew || !this.silentTrackSource)) {
      if (this.silentTrackSource) {
        this.silentTrackSource.stop();
        this.silentTrackSource.disconnect();
        this.silentTrackSource = null;
      }
      const buffer = this.audioContext.createBuffer(1, 1, 22050); // 1サンプル、モノラル
      this.silentTrackSource = this.audioContext.createBufferSource();
      this.silentTrackSource.buffer = buffer;
      this.silentTrackSource.connect(this.audioContext.destination);
      this.silentTrackSource.loop = true; // ループ再生してオーディオコンテキストをアクティブに保つ
      this.silentTrackSource.start(0);
      console.log('Playing silent track for iOS compatibility.');
    }
  }

  // AudioContextがアクティブであることを保証する公開メソッド
  public ensureAudioContextActive(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.isIOS || !this.audioContext) {
        resolve(); // iOSでない、またはAudioContextがない場合は何もしない
        return;
      }
      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume().then(() => {
          console.log('AudioContext resumed via ensureAudioContextActive.');
          this.playSilentTrack(true); // 新しいサイレントトラックを再生してアクティブを維持
          resolve();
        }).catch(error => {
          console.error('Error resuming AudioContext via ensureAudioContextActive:', error);
          reject(error);
        });
      } else {
        this.playSilentTrack(true); // 常に新しいサイレントトラックを再生
        resolve();
      }
    });
  }

  public speak(text: string): Promise<void> {
    return new Promise(async (resolve, reject) => { // asyncを追加
      if (!this.synth) {
        console.warn('Speech synthesis not supported in this browser.');
        reject('Speech synthesis not supported in this browser.');
        return;
      }

      // speakの直前にAudioContextをアクティブに保つための処理を呼び出す
      try {
        await this.ensureAudioContextActive();
      } catch (error) {
        console.error('Failed to ensure AudioContext active before speech:', error);
        // エラーが発生しても、音声合成は試行する
      }
      
      console.log("Playing text:", text); // デバッグログを追加

      let voiceToUse = this.selectedVoice;
      if (!voiceToUse) {
        console.warn('No preferred voice selected, attempting to use default en-US voice.');
        voiceToUse = this.voices.find(voice => voice.lang === 'en-US') || this.voices[0] || null;
        if (!voiceToUse) {
          console.error('No voices available for speech synthesis.');
          reject('No voices available for speech synthesis.');
          return;
        }
      }

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.voice = voiceToUse;
      utterance.lang = voiceToUse.lang;
      utterance.rate = 1; // 速度
      utterance.pitch = 1; // ピッチ

      utterance.onend = () => {
        resolve();
      };

      utterance.onerror = (event) => {
        console.error('SpeechSynthesisUtterance.onerror', event);
        reject(event);
      };

      this.synth.speak(utterance);
    });
  }

  public stop(): void {
    if (this.synth && this.synth.speaking) {
      this.synth.cancel();
    }
  }
}

export const audioController = new AudioController();