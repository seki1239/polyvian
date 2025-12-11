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
      console.warn('No English voices found.');
      this.selectedVoice = null;
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

  private playSilentTrack() {
    if (!this.isIOS || !this.audioContext) return;

    // 無音の短いオーディオバッファを作成し再生する
    if (this.audioContext.state === 'running' && !this.silentTrackSource) {
      const buffer = this.audioContext.createBuffer(1, 1, 22050); // 1サンプル、モノラル
      this.silentTrackSource = this.audioContext.createBufferSource();
      this.silentTrackSource.buffer = buffer;
      this.silentTrackSource.connect(this.audioContext.destination);
      this.silentTrackSource.loop = true; // ループ再生してオーディオコンテキストをアクティブに保つ
      this.silentTrackSource.start(0);
      console.log('Playing silent track for iOS compatibility.');
    }
  }

  public speak(text: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.synth || !this.selectedVoice) {
        console.warn('Speech synthesis not ready or no voice selected.');
        reject('Speech synthesis not ready or no voice selected.');
        return;
      }

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.voice = this.selectedVoice;
      utterance.lang = this.selectedVoice.lang;
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