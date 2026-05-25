/* ===============================
   型定義
================================ */
declare const Android: {
    getSafeAreaInsets(): string;
};

/* ===============================
   項目定義
================================ */
const initButtonElement = document.getElementById("initButton") as HTMLButtonElement;
const heartSutraTextAreaElement = document.getElementById("heartSutraTextArea") as HTMLDivElement;
const labelContainerElement = document.getElementById("labelContainer") as HTMLDivElement;
const customToastElement = document.getElementById("customToast") as HTMLDivElement;

/* ===============================
   定数定義
================================ */
// 般若心経文節配列
const HEART_SUTRA_PHRASES: string[] = [
    "仏説摩訶般若波羅蜜多心経",
    "観自在菩薩",
    "行深般若波羅蜜多時",
    "照見五蘊皆空",
    "度一切苦厄",
    "舎利子",
    "色不異空",
    "空不異色",
    "色即是空",
    "空即是色",
    "受想行識",
    "亦復如是",
    "舎利子",
    "是諸法空相",
    "不生不滅",
    "不垢不浄",
    "不増不減",
    "是故空中",
    "無色無受想行識",
    "無眼耳鼻舌身意",
    "無色声香味触法",
    "無眼界",
    "乃至無意識界",
    "無無明",
    "亦無無明尽",
    "乃至無老死",
    "亦無老死尽",
    "無苦集滅道",
    "無智亦無得",
    "以無所得故",
    "菩提薩埵",
    "依般若波羅蜜多故",
    "心無罣礙",
    "無罣礙故",
    "無有恐怖",
    "遠離一切顛倒夢想",
    "究竟涅槃",
    "三世諸仏",
    "依般若波羅蜜多故",
    "得阿耨多羅三藐三菩提",
    "故知般若波羅蜜多",
    "是大神呪",
    "是大明呪",
    "是無上呪",
    "是無等等呪",
    "能除一切苦",
    "真実不虚",
    "故説般若波羅蜜多呪",
    "即説呪曰",
    "羯諦",
    "羯諦",
    "波羅羯諦",
    "波羅僧羯諦",
    "菩提薩婆訶",
    "般若心経"
];

// 般若心経文字配列
const HEART_SUTRA_CHARS: string[] = Array.from(new Set(HEART_SUTRA_PHRASES.join('')));

// プレースホルダー文字
const PLACEHOLDER: string = "〇";

/* ===============================
   状態管理用変数
================================ */
// 文節番号
let currentPhraseIndex: number = 0;

// 文節内の現在の文字位置
let currentCharIndex: number = 0;

// トーストの非表示タイマー
let toastTimeout: number | null = null;

// 入力ロックフラグ（true：入力ロック中・false：入力可能）
let isInputLocked: boolean = false;

/* ===============================
   共通関数（セーフエリア・演出）
================================ */
/**
 * セーフエリア再計算処理
 */
function refreshSafeArea(): void {
    const jsonStr = Android.getSafeAreaInsets();
    if (jsonStr && jsonStr !== "{}") {
        // インセットを取得し、CSS変数を更新する。
        const insets = JSON.parse(jsonStr);
        const doc = document.documentElement;
        doc.style.setProperty('--safe-top', `${insets.top}px`);
        doc.style.setProperty('--safe-bottom', `${insets.bottom}px`);
    }
}

/**
 * エラー表示処理
 */
function showError(): void {
    if (customToastElement) {
        // 既存のタイマーがあればクリアする。
        if (toastTimeout) clearTimeout(toastTimeout);

        // アニメーションを再起動するために一度クラスを外す。
        customToastElement.classList.remove("show");
        void customToastElement.offsetWidth; // リフロー強制

        // クラスを付けて表示する。
        customToastElement.classList.add("show");

        // １．５秒後に非表示にする。
        toastTimeout = window.setTimeout(() => {
            customToastElement.classList.remove("show");
        }, 1500);
    }
}

/* ===============================
   ゲームロジック
================================ */
/**
 * ゲーム初期化処理
 */
function initGame(): void {
    // 入力ロックを解除する。
    isInputLocked = false;

    // ボタンを有効化する。
    const buttons = document.querySelectorAll(".answerButton") as NodeListOf<HTMLButtonElement>;
    buttons.forEach(btn => btn.style.pointerEvents = "auto");

    // 状態と演出を初期化する。
    heartSutraTextAreaElement.innerHTML = "";
    heartSutraTextAreaElement.classList.remove("completed");
    currentPhraseIndex = 0;

    // 文節設定処理を呼び出す。
    setPhrase();
}

/**
 * 文節設定処理
 */
function setPhrase(): void {
    const buttons = document.querySelectorAll(".answerButton") as NodeListOf<HTMLButtonElement>;

    // 全ての文節をクリアした場合、終了演出を発動する。
    if (currentPhraseIndex >= HEART_SUTRA_PHRASES.length) {
        labelContainerElement.innerHTML = `<span class="mantra-completion">🌸 真言完成 🌸</span>`;
        buttons.forEach(btn => btn.innerText = "🙏");

        // テキストエリアに完了演出クラスを付ける。
        heartSutraTextAreaElement.classList.add("completed");
        return;
    }

    // 現在の文節を取得・保持する。
    const phrase = HEART_SUTRA_PHRASES[currentPhraseIndex]!;
    currentCharIndex = 0;

    // ９文字以上の文節の場合、はみ出し防止用のクラスを付ける。
    if (phrase.length >= 9) {
        labelContainerElement.classList.add("long-phrase");
    } else {
        labelContainerElement.classList.remove("long-phrase");
    }

    // プレースホルダーを文節の文字数分生成する。
    labelContainerElement.innerHTML = "";
    for (let index = 0; index < phrase.length; index++) {
        const span = document.createElement("span");
        span.className = "placeholder-char";
        span.innerText = PLACEHOLDER;
        labelContainerElement.appendChild(span);
    }

    // ボタン設定処理を呼び出す。
    setButtons();
}

/**
 * ボタン設定処理
 */
function setButtons(): void {
    const phrase = HEART_SUTRA_PHRASES[currentPhraseIndex]!;
    const correctChar = phrase[currentCharIndex];
    const buttons = document.querySelectorAll(".answerButton") as NodeListOf<HTMLButtonElement>;

    // 正解以外の文字をランダムに４個抽出する。
    let wrongChars = HEART_SUTRA_CHARS.filter(char => char !== correctChar);
    wrongChars.sort(() => 0.5 - Math.random());
    wrongChars = wrongChars.slice(0, 4);

    // 正解・不正解を混ぜてボタンに配置する。
    let setChars = [correctChar, ...wrongChars];
    setChars.sort(() => 0.5 - Math.random());

    // ボタンのテキストと押下イベントを設定する。
    buttons.forEach((btn, index) => {
        btn.innerText = setChars[index]!;
        btn.onclick = () => handleButtonClick(setChars[index]!);
    });
}

/**
 * ボタン押下処理
 */
function handleButtonClick(clickedChar: string): void {
    // 全文節終了後の場合、処理を終了する。
    if (currentPhraseIndex >= HEART_SUTRA_PHRASES.length) return;

    // アニメーション中は入力を無視する。
    if (isInputLocked) return;

    const phrase = HEART_SUTRA_PHRASES[currentPhraseIndex]!;
    const correctChar = phrase[currentCharIndex];

    // 押された文字が正解かどうかを判定する。
    if (clickedChar === correctChar) {
        // 正解の場合
        const spans = labelContainerElement.querySelectorAll("span");
        const targetSpan = spans[currentCharIndex]!;

        // クラスを付け替えて、アニメーションを発動させる。
        targetSpan.className = "pop-in-char";
        targetSpan.innerText = correctChar;

        currentCharIndex++;

        // 文字位置・文節位置を判定する
        if (currentCharIndex === phrase.length) {
            // 文節完成の場合

            // 入力ロックし、ボタンを無効化する。
            isInputLocked = true;
            const buttons = document.querySelectorAll(".answerButton") as NodeListOf<HTMLButtonElement>;
            buttons.forEach(btn => {
                btn.innerText = ""; // 文字を消し、反応があったことを視覚的に伝える。
                btn.style.pointerEvents = "none"; // タッチを無効化する。
            });

            // アニメーションを見せるため、少し間を空けてから（０．３秒）ノートに書き込む。
            setTimeout(() => {
                if (heartSutraTextAreaElement.innerHTML !== "") {
                    heartSutraTextAreaElement.innerHTML += "<br>";
                }
                heartSutraTextAreaElement.innerHTML += phrase;
                heartSutraTextAreaElement.scrollTop = heartSutraTextAreaElement.scrollHeight;

                currentPhraseIndex++;
                setPhrase();

                // 次の文節がセットされたら、入力ロックを解除する。
                buttons.forEach(btn => btn.style.pointerEvents = "auto");
                isInputLocked = false;

            }, 300);
        } else {
            // 文節完成以外の場合、ボタン設定処理を呼び出す。
            setButtons();
        }
    } else {
        // 不正解の場合
        showError();
    }
}

// ===========================================
// ページ読み込み完了後初期化処理
// ===========================================
document.addEventListener("DOMContentLoaded", async () => {
    // ゲーム初期化処理を呼び出す。
    initGame();

    // 初期化ボタンにイベント押下処理を設定する。
    initButtonElement.addEventListener("click", initGame);

    // 描画完了後に表示する。
    document.body.classList.remove("preload");

    // セーフエリアを再計算させる。
    requestAnimationFrame(() => refreshSafeArea());
});

// ===========================================
// ページ読み込み完了後初期化処理
// ===========================================
document.addEventListener("visibilitychange", () => {
    if (!document.hidden) {
        // セーフエリアを再計算させる。
        requestAnimationFrame(() => refreshSafeArea());
    }
});
