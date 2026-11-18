// ============================================================
// 低ポリゴン版（ためし）専用の ストーリー
//   シナリオ最新版（スターと＿claude用／スターと＿シナリオ.pdf）の 場面1 まで。
//   2D 版（リポジトリ START の js/story.js）とは 別の ファイルです。
//
// ■ 2D と 同じ 命令に くわえて、低ポリゴン版だけの 命令
//   await stopAlarm()            … 時計に「タップして とめる」が 出て、プレイヤーが 止めるまで 待つ
//   walked()                     … スタート地点から 何px 歩いたか
//   flags.run = true             … 主人公が 走る（STORY.runSpeed）
//   await policeTurn()           … 警察が 体を 一周まわして 怪盗（黄色い人）に 変わる
//   show('gun') / show('flowers')… 警察の 拳銃 ／ 銃から 出た 花束
//   await runWithKaitou()        … 怪盗が 主人公の 手を取って 上へ 走る
//   place('house')               … 怪盗の家の前（星空の 下の 家）に うつる
//   moonlight()                  … 月の光が 怪盗を てらす
//   await enterHouse()           … 怪盗が ドアを 開けて 家に入り、主人公も つづく
//   await arriveHouse()          … 怪盗と 主人公が 走って 家の前に 着く
//   breakWall('left' / 'right') / repairWall() … 左（右）の かべを こわす ／ もとに もどす（時が もどった 時）
//   （プレイヤーが 自由に 歩ける 間は、進む 方向に 矢印が 出ます）
//   主人公M（心の声）は （ ） で かこむ
// ============================================================

// 書き込む 欄を 出し、書き終わったら 研究員が メモを とる（場面1と 同じ「ふむふむ…。」）
//   研究員の カットが 出て いれば、メモの あと 話す すがたに もどす
async function writeMemo(opt) {
  const v = await writeIn(opt);
  const lc = document.getElementById('labCut'), shown = !lc.classList.contains('hidden');
  await labCut('memo');
  await wait(1000);
  await labCut(shown ? 'talk' : false);
  return v;
}

const STORY = {
  // 場面1 の 地図（田野さんの「スターとマップ」より。100px = 1m、y は 上へ いくほど 小さい）
  //   下から：目を覚ます 部屋 → 仕切り（まんなかに 出入口）→ 植木の ある 長い 通路（バケモノの 場面）
  //          → 階段（3m 上る）→ 柵に かこまれた 家の前の 広場 → 家（アーチの ドア）
  map: {
    floorLeft: 255, floorRight: 948,     // 通路の かべの 内がわ
    walkLeft: 300, walkRight: 905,       // 両わきに 植木が あるので 歩けるのは 少し 内がわ
    floorBottom: 5990,                   // 目を覚ます 部屋の 下の かべ
    corridorTop: -930,                   // ここから 上は 階段（バケモノ → 道 → 迷路 → 警察 の ずっと 先）
    mazeSouth: 1120,                     // 迷路の 南の はし（入口）。迷路は 北へ 3列×6段
    stairsTop: -2445, stairsRise: 3,       // 階段を 上りきった 所（家の前の 広場の 手前の はし）
    plazaTop: -3399, plazaLeft: -1015, plazaRight: 1695,   // 家の前の 広場（柵の 内がわ）
    houseFront: -3088,                   // 家の 前の 面（ドアの まんなかは x 600 あたり）
    monsterY: 2555,                      // バケモノの 場面
    walls: [                             // 目を覚ます 部屋の 仕切り（まんなかに 出入口）
      { x1: 255, x2: 533, y1: 4713, y2: 5025 },
      { x1: 670, x2: 948, y1: 4713, y2: 5025 },
      { x1: 255, x2: 533, y1: 2010, y2: 2110 },          // バケモノの 場面と 迷路の 間の 仕切り（まんなかに 出入口）
      { x1: 670, x2: 948, y1: 2010, y2: 2110 },
    ],
  },
  playerStart: { x: 603, y: 5792 },
  walkSpeed: 330,
  runSpeed: 520,                      // 2周目は 走る

  autoSpeed: 4,
  autoChoices: [
    '行かない',                              // つぎは 左の「助けに行く」
    'ヘッドホンのコード',
    '緑', '黄色',                             // 場面1 二周目の 迷路の 質問
    '3つとなりの{街|まち}で…。', '{巻|ま}きもどす',      // 巻き戻すと 家を 答える 選択肢に もどる
    'すぐそこです。', 'にげる',
    '楽しそうな空気を{壊|こわ}さないよう\n{遠慮|えんりょ}する',
    '切ってほしいと{伝|つた}える。', '代わりに切る',        // 場面2：子供Aが 切りそこねて、代わりに 切る
    '分からない',
  ],
  // オートで 書き込む 欄に 入れる ことば（じゅんばんに 使う）
  autoWrites: ['投げる', 'がんばりやさん', '前もって 人数を 教えてくれたから'],

  // ---------- ○ホーム画面の ナレーション（「始める」を 押したあとに 流れる） ----------
  //   ナレーションは 画面を 暗くして 白い 文字で まんなかに 出る。研究員は 研究室の カットで 話す
  home: async () => {
    await say('ナレーション', 'これはとあるロボットが、\n人間を研究するために作ったゲーム「スターと」です。');
    await say('ナレーション', '長いこと起動されるのを待っています。\n遊んであげましょう。');
    await labCut('talk');
    await say('研究員', 'やっと遊んでくれる人が{現|あらわ}れたのか！');
    await say('研究員', 'どんなデータが取れるか、\nこっそりここから見ていよう！', { face: 'r2' });
    await labCut(false);
  },

  // ---------- ○何もない部屋 ----------
  opening: async () => {
    flags.loop = 1;
    flags.run = true;                                                      // 1周目も 2周目と 同じ 速さで 走る
    await fadeOut('black', 0);
    await wait(600);
    await STORY.home();
    await wait(400);
    await say('ナレーション', 'あなたは、\n主人公と{共|とも}にこの世界からだっしゅつを目指しましょう。');
    await say('ナレーション', 'よく考え、あなたの思う{未来|みらい}に進んでください。');
    await say('ナレーション', 'では、スタートです。');
    await blink();
    showItems();                                                           // 目を 覚ましたら もちものを 出す
    await say('主人公', 'ねむっていたのか…？まだ目が{覚|さ}めきらないが、とにかくここを出なくては。', { face: 'heroSleepy' });
    // 【プレイヤーが操作し、自由に歩く。】
  },

  triggers: [
    {
      // 目が覚めた 位置と 細い道（仕切りの 出入口）の 手前の 中間まで 来たら、人物Aの 声が 聞こえる
      id: 'voice',
      y: 5408,                       // （目を覚ます 位置 y 5792 ＋ 仕切りの 出入口の 手前 y 5025）÷ 2
      if: () => flags.loop === 1,
      run: async () => {
        show('exclaim');
        await say('???', 'おーい！だれかいるのか？\n助けてくれー！');
        hide('exclaim');
        // 助けに行くか 迷う
        //   ②行かない：人物A「助けてってばー！」と 何度も 聞こえる。
        //   2回 つづけて ② を えらぶと、①助けに行く だけが 出る
        let stay = 0;
        while (true) {
          if (stay === 0) await say('主人公', '…？', { face: 'hero' });
          const c = await choose(stay >= 2 ? ['助けに行く'] : ['助けに行く', '行かない']);
          if (c === '助けに行く') break;
          stay++;
          show('exclaim');
          await say('???', '助けてってばー' + '！'.repeat(stay));           // 残るたびに「！」が ふえる
          hide('exclaim');
        }
        flags.heard = true;
        // ①：再び 自由に 動ける
      },
    },
    {
      // ---------- ○広い部屋 ----------
      id: 'encounter1',
      y: 3010,                       // バケモノ（y 2555）の 少し 手前
      if: () => flags.loop === 1,
      run: async () => {
        await camera(2070, 900);
        await say('???', 'やっと助けが来たのか！', { face: 'kaitou5' });     // 笑顔で 言う
        await say('主人公', '（な、なんだこのバケモノは…！）', { face: 'hero' });
        await wait(2000);                                                   // 2秒 驚き 立ち尽くす
        await say('???', '早くこいつを…！うっ。', { face: 'kaitou4' });
        monster('eat');                                                     // あっという間に 食べられる
        await wait(900);
        monster('alone');
        await wait(500);
        await say('バケモノ', '…。', { face: 'monster' });
        await wait(800);                                                    // 主人公を じっと 見つめ
        const away = monsterWalk(-1300, 5200);                              // ゆっくり 歩き、
        await wait(1050);                                                   // かべに とどいたら
        breakWall();                                                        // 壁を 壊して
        await away;                                                         // 去る
        monster('none');
        await walkTo(2830, 700);
        await say('主人公', 'え…。死んだ？\n何が起きたんだ？', { face: 'hero' });
        await wait(1200);                                                   // 呆然と する 主人公

        // 2回目の 時計：プレイヤーが 自分で 止める
        show('watch');
        show('ring');
        await say('時計', 'ピピピピッ。');
        await say('主人公', 'あれ？⟦時計⟧なんて持っていたか？', { face: 'hero' });
        await stopAlarm();                                                  // 止めるように さそう エフェクト
        hide('ring');
        await wait(300);
        hide('watch');
        await fadeOut('white', 500);                                        // 目の前が 光に 包まれる
        await say('主人公', 'ッ！？', { face: 'hero' });

        // ---------- ○何もない部屋（再び 目を 開けると、眠りから 目を覚ました 部屋） ----------
        flags.loop = 2;
        getWatch();                                                         // 2周目から もちものに 時計が 入る
        repairWall();                                                       // 時が もどったので 壁も もとどおり
        monster('apart');
        resetPlayer();
        follow();
        await fadeIn(600);
        show('exclaim');
        await say('???', '助けてー！');
        hide('exclaim');
        await say('主人公', 'な、なんだ？\nさっきと同じ声が聞こえる…。', { face: 'hero' });
        await say('主人公', '行ってみよう。', { face: 'hero' });
        flags.run = true;                                                   // 【プレイヤーが 操作】走る 主人公
      },
    },
    {
      id: 'encounter2',
      y: 3010,                       // バケモノ（y 2555）の 少し 手前
      if: () => flags.loop === 2,
      run: async () => {
        flags.run = false;
        await camera(2070, 900);
        await say('主人公', '（やっぱり！さっきと同じ⟦黄色い目⟧の人だ。）', { face: 'hero' });   // ⟦ ⟧ の 中は 赤い 文字
        await say('主人公', '（さっきより早く着けたのか？）', { face: 'hero' });
        await say('???', 'こいつをやっつけてくれ！', { face: 'kaitou5' });
        await say('主人公', 'やっつける！？\nどうすればいいんだ？', { face: 'hero' });
        await choose(['カセットテープ', 'ヘッドホンの\nコード', 'リュックサック'], { speaker: '主人公の荷物' });
        // 研究員が どう たおすかを 聞く → 書いた 通りに たおす
        await labCut('talk');
        await say('研究員', 'これを使ってどうやっつけるんだい？');
        const how = await writeMemo({ label: 'これを 使って どう たおす？', placeholder: '{例|れい}：投げる' });
        await labCut(false);
        await say('主人公', 'えいっ！', { face: 'hero' });
        if (/投|なげ|ぶつけ|ほうり|ほうる|放|飛ば|とば/u.test(how)) await throwItem();   // 投げる 時は 投げて 追い払う
        else await meleeItem();                                             // それ以外（たたく・しばる・かぶせる など）は かけよって 当てる
        monster('down');
        await wait(900);
        monster('apart');
        await wait(500);
        const away2 = monsterWalk(900, 3000);                               // 右へ 歩いて、
        await wait(420);
        breakWall('right');                                                 // 壁を 壊して 去る
        await away2;
        monster('captive');
        await say('???', '少年！ありがとう！', { face: 'kaitou2' });
        await say('???', '助けてもらったところ申し{訳|わけ}ないが、\n急いでるんだ！', { face: 'kaitou5' });
        await say('???', 'またいつか会えたら\n{必|かなら}ずお礼をするよ！', { face: 'kaitou5' });
        await say('???', '本当にありがとう！', { face: 'kaitou5' });
        await captiveWalk(136, 0, 250);                                      // 清らかな 笑顔で 礼を 伝え、すぐに 去る
        await captiveWalk(0, -700, 1100);                                    // 仕切りの 出入口を ぬけて 真上へ 走って いく
        monster('none');
        await say('主人公', 'あぁ…。', { face: 'hero' });
        await say('主人公', '（というか、どうなっているんだ？\n同じことが2回も起きている…。）', { face: 'hero' });

        flags.afterMonster = true;
        flags.run = true;                                                   // 迷路まで・迷路の 中も 走る（バケモノの 前と 同じ 速さ）
        mazeArrow(true);                                                    // 前に 進むよう 矢印
        follow();                                                           // 【プレイヤーが 操作】迷路の 前まで 歩く
      },
    },
    {
      // 場面1 二周目：バケモノの 場面の 先の 迷路の 前に 立った とき
      id: 'maze',
      y: 1250,                       // 迷路の 入口（y 1120）の 少し 手前
      if: () => flags.loop === 2 && flags.afterMonster,
      run: async () => {
        // ---- ミニゲーム 迷路：とちゅうの 緑の とびらは 研究員の 質問に 正しく 答えると 開く。かべを こわして 迂回しても よい ----
        //   迷路の 先には、警察官が 待っている
        mazeArrow(false);
        await say('主人公', '{迷路|めいろ}？行ってみる…？', { face: 'hero' });
        mazeStart();
        const QUIZ = {
          gate1: { q: 'バケモノの色は何色だった？', opts: ['緑', '赤'], ok: '緑' },
          gate2: { q: 'さっき助けた人の目の色は何色だった？', opts: ['青', '黄色'], ok: '黄色' },
        };
        for (;;) {
          const ev = await mazeWalk();                                      // 【プレイヤーが 操作】迷路を 歩く
          if (ev === 'exit') { await mazeGoalStand(); break; }           // ゴール：警察の 顔が 見える ように 立つ
          const qz = QUIZ[ev];
          await labCut('talk');
          await say('研究員', qz.q);
          const a = await choose(qz.opts);
          if (a === qz.ok) {
            await say('研究員', '{正解|せいかい}！道を開けよう。');
            await labCut(false);
            await mazeOpen(ev === 'gate1' ? 1 : 2);                         // とびらが 地面に しずむ
          } else {
            await say('研究員', 'ざんねん。ちがうようだね。');
            await labCut(false);
            await stepBack(150, 600);                                       // とびらの 前から 少し 下がる（もう一度 近づくと また 聞かれる）
          }
        }

        // ---- 警察（迷路の 先で 待っていた）----
        // カメラは 迷路の ゴールで 主人公と 警察の あいだに 合わせて ある（警察の 顔が 見える）
        await say('{警察|けいさつ}', 'おい！そこの君！\nこの先で{事件|じけん}が起きたと聞いたが、');
        await say('{警察|けいさつ}', '何か見なかったか！？');
        await say('主人公', '（早くこの世界から出なくては\nいけないんだ…。）', { face: 'hero' });
        await say('主人公', '（めんどうなことに\n{巻|ま}きこまれたくはない。）', { face: 'hero' });
        await say('主人公', '{事件|じけん}…。知らないです。', { face: 'hero' });     // 目を 合わせずに

        // 警察に 家を 聞かれる 場面（③巻き戻す を えらぶと ここに もどる）
        let act, rewound = false;
        while (true) {
          await say('{警察|けいさつ}', 'そうか。');
          await say('{警察|けいさつ}', '{最近|さいきん}はここも{危|あぶ}なくなってきたから、\n気をつけろよ。');
          await say('{警察|けいさつ}', '…君、お家は？');
          if (rewound) {
            await say('主人公', '他の言い{訳|わけ}は…。', { face: 'hero' });   // 巻き戻した 時
          } else {
            await say('主人公', '（家は…。）', { face: 'hero' });
            await say('主人公', '（どうしよう！すぐ答えなかったら\nあやしまれる！）', { face: 'hero' });
            await say('主人公', 'えーっと。', { face: 'hero' });
          }
          const answer = await choose(['すぐそこです。', '3つとなりの{街|まち}で…。', '…。']);
          await say('主人公', answer, { face: 'hero' });
          if (answer === 'すぐそこです。') await say('{警察|けいさつ}', 'ここら{辺|へん}に{登録|とうろく}されてる\n{住宅地|じゅうたくち}はないぞ。');
          else if (answer === '3つとなりの{街|まち}で…。') await say('{警察|けいさつ}', 'ここは他の{街|まち}の者は\n立ち入り{禁止|きんし}だぞ。');
          else await say('{警察|けいさつ}', '答えられないのか？');
          await say('{警察|けいさつ}', 'どういうことだ？\n君、少しだけ話を聞いてもいいかな？');   // 動揺する 主人公を 怪しむ
          if (!rewound) {                                                   // 巻き戻した 時は 言わない
            await say('主人公', 'このままだとまずい！', { face: 'hero' });
            // 警察に 対しての 行動が 出たあと、画面に 透明度50%の 黒い 幕が はられ、研究員の カットが 入る
            // 選択肢が 出た 直後に（押す すきを あたえず）黒い 幕と 研究員。選択肢は 幕の 下に 見えたまま
            await peekChoose(['{戦|たたか}う', 'にげる', '{巻|ま}きもどす']);
            await labCut('dim');
            await say('研究員', 'この場面では、何を{優先|ゆうせん}して行動を{選|えら}ぶのかを研究しているんだ。');
            await say('研究員', 'この行動は、大事なデータとして取らせていただこう！', { face: 'r2' });
            await labCut(false);
            unpeek();
          }
          act = await choose(['{戦|たたか}う', 'にげる', '{巻|ま}きもどす']);
          if (act !== '{巻|ま}きもどす') break;
          // ③：警察に 家を 聞かれる 場面に 巻き戻される
          rewound = true;
          show('watch');
          await wait(300);
          await fadeOut('white', 300);
          hide('watch');
          await fadeIn(400);
        }
        let fled = false;
        if (act === '{戦|たたか}う') {
          // 戦う：バケモノの 時と 同じように 荷物を 選んで、どう 戦うかを 書く。警察は よけて ピストルを かまえる
          await say('主人公', 'いっそ{戦|たたか}うか…！', { face: 'hero' });
          await choose(['カセットテープ', 'ヘッドホンの\nコード', 'リュックサック'], { speaker: '主人公の荷物' });
          await labCut('talk');
          await say('研究員', 'これを使ってどう{戦|たたか}うんだい？');
          const how = await writeMemo({ label: 'これを 使って どう {戦|たたか}う？', placeholder: '{例|れい}：投げる' });
          await labCut(false);
          await say('主人公', 'えいっ！', { face: 'hero' });
          await attackPolice(/投|なげ|ぶつけ|ほうり|ほうる|放|飛ば|とば/u.test(how));   // 警察は さっと よける
          await say('{警察|けいさつ}', 'むだなていこうはやめろ！');
          show('gun');                                                      // ピストルを かまえる
        } else {
          // にげる：警察と 同じ 足の 速さで、迷路を 逆に もどる 追いかけっこ。入口の 手前まで にげると 入口が しまる
          await say('主人公', '{逃|に}げろっ！今までの道を{戻|もど}るしかない！', { face: 'hero' });
          await labCut('memo');                                             // 研究員が メモを する 仕草
          await wait(1000);
          await labCut(false);
          await policeChase();                                              // 【プレイヤーが 操作】追いつかれるまで にげる
          await say('{警察|けいさつ}', 'にげないでくれよ！');
          show('flowers');                                                  // ピストルでは なく すぐに 花束
          fled = true;
        }
        if (!fled) {
          await say('主人公', 'ピストル！死にたくないよ！', { face: 'hero' });
          await wait(2000);                                                 // 主人公が 2秒 身構える
          await say('{警察|けいさつ}', 'パンッ！');
          await fadeOut('white', 80);                                       // 発砲する
          await fadeIn(300);
          show('flowers');                                                  // 銃弾では なく 花束が 出る
          await wait(2000);                                                 // 2秒ほど 固まる 主人公
          await say('主人公', '…？', { face: 'hero' });
          await say('{警察|けいさつ}', 'おいおい。\nなんか言ってくれよ。');
          await say('主人公', 'え？', { face: 'hero' });
        } else await wait(1200);
        await say('{警察|けいさつ}', 'さっきは助けてくれてありがとう！');
        hide('gun');
        hide('flowers');
        await policeTurn();                                                 // 体を 一周 まわすと、人物Aの 姿へ

        // ---- 怪盗 ----
        await say('主人公', 'さっきの！', { face: 'hero' });
        await say('かいとう', 'やっとわかってくれたか！', { face: 'kaitou2' });
        await say('主人公', '（でも、どういうことだ？\nおそわれていた人が、）', { face: 'hero' });
        await say('主人公', '（{警察|けいさつ}に{変装|へんそう}して、\n今はピストルで{撃|う}とうとした？）', { face: 'hero' });
        await say('かいとう', 'やれやれ。もっとおどろいてくれよ。\n君はこの世界に{初|はじ}めて来たんだろう？', { face: 'kaitou3' });
        await say('かいとう', '心細いと思って、君を楽しませるために\n色々と用意したんだ！', { face: 'kaitou2' });
        await say('かいとう', '美味しい食事も、いろんな人との出会いも！\n{最後|さいご}にはとっておきのお楽しみが待っている。', { face: 'kaitou2' });
        await say('かいとう', '君、⟦時計⟧を持っているだろう？', { face: 'kaitou1' });
        show('watch');
        await say('主人公', 'あぁ、これ。\nこんなもの持っていなかったのに。', { face: 'hero' });
        await say('かいとう', 'ふふふ。', { face: 'kaitou2' });
        await say('かいとう', 'このアラームが鳴った時に\n自分で止めると時間をもどせるんだ。', { face: 'kaitou1' });
        await say('かいとう', '本当の人生をやり直すことは\nできないが、この世界ではそれがかなう。', { face: 'kaitou1' });
        await say('かいとう', 'どうだ？面白いだろう！？', { face: 'kaitou2' });
        hide('watch');
        await say('主人公', '時間をもどす…。\n{確|たし}かにさっきは時がもどっていた。', { face: 'hero' });
        await say('かいとう', 'ぜひこの世界を楽しんでくれ！\nさぁ。行こう！', { face: 'kaitou1' });
        if (fled) await mazeSink();                                         // にげた ときは 迷路が 地面に しずんで なくなる
        // 怪盗は 主人公を 置いて 走り出す。【プレイヤーの 操作】怪盗に ついていく
        await kaitouRunAhead();
        follow();
        await say('主人公', 'この人は何か知っているのかもしれない。\nついていこう。', { face: 'hero' });   // 動けるように なる 時に
        flags.follow = true;
        flags.run = true;                                                   // かいとうに ついていく 時も 2周目と 同じ 速さ
      },
    },
    {
      // 怪盗を 追って 階段まで 来たら、暗い 通路を 抜けて 家の前へ
      id: 'house',
      y: -765,
      if: () => flags.follow,
      run: async () => {
        flags.follow = false;
        flags.run = false;                                                  // 家の 前と 中は 今までの 速さ
        await fadeOut('black', 800);

        // ---------- ○怪盗の家の前（暗い通路を抜け、星空の もとに ポツンと 佇む 家） ----------
        police('none');
        place('house');
        const arrive = arriveHouse('follow');                               // 先に 着いた 怪盗の もとへ
        await fadeIn(900);
        await arrive;
        await say('かいとう', 'こんなに走ったのは{久々|ひさびさ}だ！', { face: 'kaitou2' });
        await say('かいとう', '君を楽しませるはずが\nぼくも楽しんでしまっているよ。', { face: 'kaitou2' });
        await say('かいとう', 'これからの出来事、\nどうか楽しんでくれ！', { face: 'kaitou2' });
        await say('主人公', 'ふふっ。うん。', { face: 'hero' });
        moonlight();                                                        // 月の光が 怪盗を 照らし、輝くような 笑顔に
        await wait(1500);                                                   // 一瞬 微笑む 主人公。次第に 顔が 暗くなる
        await say('主人公', '（あ…。でも、\nこの世界から出たいんだった…。）', { face: 'hero' });
        const feel = await choose(['楽しそうな空気を{壊|こわ}さないよう\n{遠慮|えんりょ}する', 'やっぱり{素直|すなお}に{伝|つた}える。']);   // 出たいと 伝えない ／ 伝える
        if (feel === 'やっぱり{素直|すなお}に{伝|つた}える。') {
          await say('主人公', '楽しませようとしているのは\nうれしいが、助けて{欲|ほ}しいんだ。', { face: 'hero' });
          await say('かいとう', '助ける…？というか、\n君は{無口|むくち}な子だと思っていたよ。', { face: 'kaitou1' });
          await say('かいとう', 'ぼくが{変身|へんしん}した時も{無反応|むはんのう}だし、\n口数も少ないし…。', { face: 'kaitou1' });
          await say('かいとう', 'なぁんだ、{素直|すなお}に{伝|つた}えられるじゃないか。\nそうか、人は見た目ではわからないね。', { face: 'kaitou2' });
        } else {
          await say('主人公', 'あぁ。楽しみだよ…。', { face: 'hero' });
          await say('かいとう', '…。', { face: 'kaitou4' });
          await say('かいとう', '本当に楽しみにしているのか…？', { face: 'kaitou4' });
          await say('かいとう', '何か言いたそうに\nしているように見えるが。', { face: 'kaitou4' });
          await say('かいとう', 'ごめんよ、きっとぼくに\n合わせてくれたんだろう？', { face: 'kaitou3' });
          await say('かいとう', '{素敵|すてき}な{優|やさ}しさだが、\n自分を{殺|ころ}してはいけないよ。', { face: 'kaitou3' });
          await say('主人公', '{殺|ころ}す？', { face: 'hero' });
          await say('かいとう', 'ものの{例|たと}えさ。自分の意見や\n{感情|かんじょう}をおさえこんでまで、', { face: 'kaitou4' });
          await say('かいとう', '他人を{優先|ゆうせん}すること。\n他人を想う{優|やさ}しさでもあるが、', { face: 'kaitou4' });
          await say('かいとう', '次第に自分が\nわからなくなるかもしれない。', { face: 'kaitou4' });
          await say('かいとう', 'これから先は自分を\n{殺|ころ}さなくていいさ。', { face: 'kaitou3' });
          await say('主人公', 'うん、わかった。\n…ここから出たい。', { face: 'hero' });
          await say('かいとう', 'そうか。出たいのか。', { face: 'kaitou1' });
        }
        // ここで ①と② が 合流
        await say('かいとう', 'そうだなぁ。\nこの世界からぬけ出すには、', { face: 'kaitou1' });
        await say('かいとう', 'とびらを開けるかぎ「⟦星⟧」を\n集める{必要|ひつよう}がある。', { face: 'kaitou1' });
        await say('かいとう', 'その⟦星⟧は、きっとこれから\n出会う人たちが持っているさ。', { face: 'kaitou1' });
        await say('主人公', '⟦星⟧を集める…。', { face: 'hero' });
        await say('かいとう', 'この家の中に、\n⟦星⟧をわたした子が一人いたはず。', { face: 'kaitou1' });
        await say('かいとう', 'まずは話してみるといい。', { face: 'kaitou2' });
        await enterHouse('open');                                           // 怪盗が ゆっくり ドアを 開ける
        await say('かいとう', 'さぁ、入って。', { face: 'kaitou1' });
        await enterHouse('in');                                             // 怪盗が 先に 入り、主人公も 後を 追う
        await fadeOut('black', 800);
        await STORY.scene2();
      },
    },
  ],

  // ============================================================
  // 場面2：緑が多い暖かな家の中 → 屋根裏
  //   地図（スターとマップ）の 1階と 屋根裏。単位は m（1階の 原点は 玄関の まんなか、奥が -z）
  //   場面2の 命令は 下の 方の コメントを 見てください
  // ============================================================
  scene2: async () => {
    const H = (text, opt) => say('主人公', text, { face: 'hero', ...opt });
    showItems(); getWatch();                                               // 場面2では 時計を 持っている（時計で 戻った ときも）
    // 子供A（青い子）は 名前を 名のるまで「子供A」、名のった あとは「リアオ」。子供B は「シィ」
    //   KA(セリフ, 顔の番号) … 顔は 子供Aの アイコン 1〜4、KB は 子供Bの アイコン 1〜3
    let nameA = '{子供|こども}A';
    const KA = (text, f, o) => say(nameA, text, { face: f && 'kidA' + f, ...o }), KB = (text, f, name = 'シィ') => say(name, text, { face: f && 'kidB' + f });
    const O = (text, face) => say('かいとう', text, { face });
    const R = (text, opt) => say('研究員', text, opt);                       // 研究員（右下の カットの 吹き出し）
    // 書き込んだ ことばへの 研究員の 相槌：「〇〇なんだね。」
    const aizuchi = t => {
      t = String(t || '').trim().replace(/[。．.！!？?、,～〜…\s]+$/u, '').replace(/(だと|と)?(思う|思います)$/u, '').replace(/(です|だよ|だね|だ|かな)$/u, '');
      return t ? `「${t}」なんだね。` : '';                       // 書き込んだ ことばを 「」で かこむ
    };

    // ---------- 時計で 戻る（場面2）----------
    //   RW.at：'S' はじめから ／ 'A' リアオが ケーキの 前に 来る ところ ／ 'B' 研究員「どうするんだい？」 ／ 'C' 二人が 机に 着席した ところ
    const RW = STORY.rewindTo || null; STORY.rewindTo = null;
    if (!RW) vmark('場面2');                         // 検証モードの 記録（時計で 戻った ときは 戻った 記録が 先に ある）
    const at = RW && RW.at !== 'S' ? RW.at : null;
    let first = null, three = false, brought = 2, cutN = (RW && RW.cutN) || 8, doorCount = 0;
    const toS = () => ({ label: '{初|はじ}めから', at: 'S' });
    const toA = () => ({ label: 'ケーキを切る場面', at: 'A' });
    const toB = () => ({ label: 'どうするか決める場面', at: 'B', cutN });
    const toC = () => ({ label: 'ケーキを食べる場面', at: 'C', cutN });
    // 「…。」の 流れ：D は 二人が 机に 着席した ところ、E は 研究員「この子供！2個とったぞ！どうする…？」
    const toD = () => ({ label: 'ケーキを食べる場面', at: 'D', cutN });
    const toE = () => ({ label: 'どうするか決める場面', at: 'E', cutN });
    // 時計で 戻れる 先を 決める（「そうだよ」と「ちがうよ」→ 教える・代わりに切る の 流れ。「…。」の 流れは まだ 戻れない）
    const rw = (...targets) => watchPoint(first && !three ? targets : null);
    // 「…。」の 流れの 戻り先（同じ 場所で、戻る 先だけ ちがう）
    const rw3 = (normal, forThree) => three ? watchPoint(forThree) : rw(...normal);

    if (!at) {
    // ---------- ○緑が多い暖かな家の中 ----------
    place('home');
    setHero(0, -1.2); heroFace(0, -5);
    sitActor(owner, 1.0, -3.0, 0); lookAt(owner, 0, -1.2);
    await fadeIn(900);
    // 家に入ると 主人公の 姿が 変わる
    await wait(400);
    await fadeOut('white', 250); setOutfit(true); await fadeIn(500);
    await O('外は寒かったからね。⟦星⟧を集めるのも{大変|たいへん}かもしれない。少しゆっくりしていくといい。', 'kaitou1');
    await H('うん。…あれ？こんな服着ていたか？');
    await O('あぁそれ。この家の中では、見た目じゃなく\n心で{接|せっ}せられるように本当の{姿|すがた}をかくして', 'kaitou1');
    await O('{過|す}ごしているんだ。', 'kaitou1');
    await O('この家にいる子たちはみんな”ワケあり”\nだからね。', 'kaitou1');
    await O('君も知らない世界にとつぜんやってきた\n”ワケありさん”だろう？', 'kaitou2');
    await H('ワケありさんか。へぇ。');
    await O('今から4つのことを{伝|つた}えるね。', 'kaitou1');
    await O('1つ。⟦星⟧は⟦青い子⟧にわたしている。', 'kaitou1');
    await O('2つ。⟦時計⟧があることを{忘|わす}れずに。\n⟦時計に{触|ふ}れれば、いつでも時を{巻|ま}き{戻|もど}せる。⟧', 'kaitou1');
    await O('3つ。君はお{腹|なか}が空いているだろうから、\nキッチンにある⟦ケーキ⟧は切って食べていいよ。', 'kaitou2');
    await O('4つ。{子供|こども}たちには、ぼくのことは\n「⟦オーナー⟧」って言えば通じると思うよ。', 'kaitou1');
    await O('いいかい？', 'kaitou1');
    await H('うん。');
    await O('ありがとう。', 'kaitou2');
    await O('青い子はたしかこんな子だったかな、、、', 'kaitou1');
    await ownerMorph();                              // かいとうが リアオの すがたに 変身して 見せて、
    await wait(900);
    await ownerMorph(null);                          // すぐに かいとうの すがたに もどる
    await wait(300);
    await O('じゃあ、早速で悪いが、\nぼくは用事があるから{失礼|しつれい}するね！', 'kaitou5');
    // 怪盗は 奥の 裏口から 去る（主人公が 歩けるように なるまで カメラは そのまま）
    //   怪盗が 主人公の 前から はなれたら、歩いている とちゅうで 主人公が 話しはじめる
    const leave = (async () => {
      await walkPath(owner, [[0, -6.7], [-2.1, -9.5], [-2.1, -18.8], [0, -19.6]], 4.2);
      await openDoor('back', 300);
      await walkActor(owner, 0, -20.6, 300); owner.visible = false;
    })();
    await wait(1100);
    await H('いそがしい人だな…。');
    await H('でも、{確|たし}かにワケありかも。');
    await H('他に行くあてもなかったし\n帰る{方法|ほうほう}すら知らなかったし');
    await H('これからがんばってだっしゅつするんだ。');
    await leave;
    watchUI(true);                                   // ここから もちものの 時計が おせる。集めた 星の 数も 出す

    // ---------- ケーキの 前へ（プレイヤーが 歩く） ----------
    await freeWalk('cake');
    heroFace(14.72, -13.57);
    await H('ケーキってこれか。');
    await say('主人公のお{腹|なか}', 'ぐるるるるぅぅぅ。');
    await H('お{腹|なか}すいたな…。食べてから⟦星⟧を{探|さが}そう。\nまずはナイフで切らなくちゃ。');
    // キッチンの はしの ナイフを とって、ケーキの 前に もどる
    await freeWalk('knife');
    heroFace(12.9, -17);
    await tapAt(TAP.knife, 'タップして とる');
    prop('rackKnife', false); prop('heroKnife', true);
    await freeWalk('back');
    heroFace(14.72, -13.57);
    } else {
      // 時計で 戻って きた：場面の 中ほどから はじめる
      place('home'); setOutfit(true); owner.visible = false;
      prop('rackKnife', false); prop('carry', false);
      if (at === 'A') {                                // キッチンで ナイフを 持って ケーキの 前
        prop('heroKnife', true);
        setHero(13.2, -13.4); heroFace(14.72, -13.57);
        look(12.4, -13.0, .9, true);
      } else {                                         // 二人とも 机に 着席（ケーキは cutN こに 切って 机の 上）
        first = at === 'D' || at === 'E' ? 'ちがうよ' : 'そうだよ'; nameA = 'リアオ'; three = at === 'D' || at === 'E';
        prop('heroKnife', false);
        cakeSliced(cutN); cake('table');
        sitHero(1.32, -14.45, 0, -14.45, -.15, 0);
        sitActor(kidA, -1.41, -14.45, Math.PI / 2, .18);
        look(0, -14.5, 1, true);
        if (at === 'B') { await serveSlice(0); await serveSlice(1); }
        if (at === 'E') { await serveSlice(0); await serveSlice(1); await serveSlice(1, true); }
      }
      watchUI(true);
      await fadeIn(900);
      if (three) { await threeTable(at); return; }     // 「…。」の 流れの とちゅうから
    }

    if (at !== 'B' && at !== 'C') {

    // 子供A（青い子）が やってくる：カメラは ゆっくり 引いて、話しかけて きたら 寄りに もどす
    look(10.0, -11.4, 1.5, false, 'slow');
    sitActor(kidA, 4.2, -8.7, Math.PI / 2);
    await wait(900);
    await walkPath(kidA, [[11.4, -8.9], [11.6, -13.4]], 4.6);   // 走って かけつける
    lookAt(kidA, heroX(), heroZ());
    look(12.4, -13.0, .9, false, 'slow');
    await KA('お、ケーキを食べるんだね。', 3);
    await KA('{間違|まちが}えた！', 1, { scale: .75 });               // 小さい 文字で
    await KA('お兄さんがケーキ切ってくれるの？', 3);
    heroFace(kidA.x, kidA.z);
    await H('？');
    await KA('ちがうの…？', 4);
    await H('⟦青い子⟧だ…。');

    // 「切ると伝える。」＝そうだよ（切ってあげる）、「切ってほしいと伝える。」＝ちがうよ（リアオが 切る）
    first = await choose(['切ると{伝|つた}える。', '切ってほしいと{伝|つた}える。']) === '切ると{伝|つた}える。' ? 'そうだよ' : 'ちがうよ';
    if (first === 'そうだよ') {                        // 切ってあげる
      await H('そうだよ。切ろうとしてたところ。');
      nameA = 'リアオ';
      await KA('やった！おいらリアオ！', 2);
      await KA('実はさっき切ろうとしたんだけど、\nこわくてできなかったんだ。', 1);
      await KA('おいらの他に5人いるから、\nオーナーさんとお兄さんふくめて8人分ね！', 2);
      await H('8等分か。');
      heroFace(14.72, -13.57);
      await H('（でも、お{腹|なか}が空いているからたくさん食べたい気持ちもある…。どうしよう？）');
      await cutByChoice();
    } else {
      await H('ちがう。美味しそうだなって見てただけだよ。');
      await KA('でもナイフ…。', 1);
      await KA('あ…、もしかしてお客さん！？', 3);
      nameA = 'リアオ';
      await KA('おいらリアオ！\nお兄さんの代わりにおいらが切ってあげるよ！', 2);
      await kidTries();                                // リアオが 切って 失敗する
      const c = await choose(['代わりに切る', '切り方を教える', '…。']);
      if (c === '切り方を教える') {
        await H('ふりかぶらず、もっとゆっくりやればきれいに切れるよ。');
        await KA('おいら、{初|はじ}めてナイフを持ったんだ。\nちょっとだけこわいから、いっしょに切って{欲|ほ}しい！', 2);
        await H('あぁ…。');
        prop('tears', false); prop('kidKnife', false); prop('heroKnife', true);
        await walkActor(kidA, 13.0, -12.3, 400); lookAt(kidA, 14.72, -13.57);
        await walkHero(12.4, -13.3, 500); heroFace(14.72, -13.57);
      } else if (c === '代わりに切る') {
        await H('代わりに切るよ。');
        prop('tears', false); prop('kidKnife', false); prop('heroKnife', true);
        await KA('わっ！お兄さんありがとう！', 2);
        await walkActor(kidA, 12.0, -12.0, 500); lookAt(kidA, 14.72, -13.57);
        await walkHero(13.2, -13.4, 500); heroFace(14.72, -13.57);
      } else {
        await H('…。');
        await KA('あ…、ごめんなさい…！', 4);
        prop('kidKnife', false);
        // リアオは 玄関から 入って 左の すみへ にげて、ふるえて 立って いる（主人公は そのまま ケーキを 切る）
        walkPath(kidA, [[11.4, -8.9], [2.0, -8.7], [-2.45, -9.0]], 4.0).then(() => { lookAt(kidA, 0, -9.0); kidA.shiver = true; });   // カーペットの 左横
        prop('heroKnife', true);
        await walkHero(13.2, -13.4, 500); heroFace(14.72, -13.57);
        three = true;
      }
      if (c === '切り方を教える') {
        await H('（さっき8{個|こ}って言っていたか？）');
        await H('（でも、お{腹|なか}も空いているから\nたくさん食べたい気持ちもある…。）');
      } else await H('さっき、8人分って言っていたか？でも、お{腹|なか}が空いているからたくさん食べたい気持ちもある…。どうしよう？');
      await cutByChoice();
    }
    if (three) { await threeTable(); return; }       // ❸ は ひとりで テーブルへ（このあと 製作中の 所で おわる）

    // ---------- 机に 運ぶ ----------
    await H('できた。{机|つくえ}に運ぼう。');
    watchPoint([toA()]);                                      // 時計で 戻れる（どの 選択でも）：リアオが 来る ところへ
    prop('heroKnife', false); prop('carry', true); cake('carry');
    const riaoComes = kidA.visible ? walkPath(kidA, [[11.4, -8.9], [-1.9, -8.9], [-2.2, -12.9]], 2.4) : null;
    await freeWalk('table');                                  // テーブルの 近くなら どこからでも 置ける
    heroFace(0, -15.5);
    await tapAt(TAP.table, 'タップして おく');
    watchPoint(null);
    prop('carry', false); cake('table');

    // ---------- ①❶❷：ダイニングで ----------
    if (riaoComes) await riaoComes;                          // リアオが まだ 来ていなければ 着くまで 待つ
    lookAt(kidA, heroX(), heroZ()); heroFace(kidA.x, kidA.z);
    await KA('お兄さんありがとう！すごくきれいに切ってある！', 2);
    await H('うん。');
    // 主人公と リアオは 椅子に 座る
    look(0, -14.5);
    await Promise.all([
      walkHeroPath(toChair(), 2.0).then(() => sitHero(1.32, -14.45, 0, -14.45, -.15, 600)),
      walkPath(kidA, [[-2.2, -14.45], [-1.6, -14.45]], 1.6).then(() => { sitActor(kidA, -1.41, -14.45, Math.PI / 2); return sitDown(kidA, .18); }),
    ]);
    }                                                        // ←ここまでが 'B'・'C' から 戻った ときに とばす ところ

    if (at !== 'B') {
    // ケーキを 一切れずつ テーブルに 置く（ホールケーキは 6切れ のこる）
    await serveSlice(0);
    await serveSlice(1);
    await wait(400);
    await KA('あのさ、おいら、2つ取ってもいいかな？', 3);
    await H('2つ？1人で2つ食べるのか？');
    if (cutN === 8) await H('（お{腹|なか}空いていても、人数通りに切ったのに。）');   // 言われた とおり 8こに 切った 場合
    else await H('（お{腹|なか}空いているから\nこっちだってたくさん食べたいのに。）');
    await KA('そ、それは…。', 1);
    // 研究員が プレイヤーに 聞く（書き込む 欄）
    await labCut('talk');
    await R('君は、この{子供|こども}のことをどう思うかな？{簡単|かんたん}な言葉で教えてほしい。');
    const feel = await writeMemo({ label: 'この{子供|こども}のことを どう思う？（かんたんな ことばで）' });
    await R('ふむふむ。なるほど。それはなんでそう思ったんだい？');
    await writeMemo({ label: 'なんで そう 思った？' });
    await R(`なるほど。${aizuchi(feel)}`);
    await R('この{子供|こども}は前もって君に人数を教えたのに、1人で2つもらおうとしている。');
    if (cutN === 8) await R('君は言われた通り\n人数に合わせて切ったのに、');
    else await R('君は自分が食べたい数を\n考えて切ったのに、');
    await R('この子が2つ食べたらケーキの数が\n合わなくなるね。');
    await labCut(false);
    await H('君の他に、かいと…じゃなくてオーナーさんと\nあと5人の子がいるんだろう？');
    await H('みんな食べられるように\nちょうど8{個|こ}分{残|のこ}るようにしたんだ。');
    await H('1人で2つ食べたら、食べられない子が出てくる。');
    await KA('お、おいらは2{個|こ}食べないよう！', 4);
    await labCut('talk');
    await R('おや、1人では食べないようだね。');
    await labCut(false);
    await H('じゃあなんで2{個|こ}って…。');
    await KA('オーナーさんとおいらだけの{秘密|ひみつ}なんだけど、\n{屋根裏|やねうら}に5人の他にもう一人いるんだ。', 1);
    await KA('その子にも、ケーキをあげたい…。', 1);
    await labCut('talk');
    await R('この{子供|こども}はうそをついていたのか。\n君をふくめて9人いるということ…。');
    } else await labCut('talk');                             // 'B'：研究員の「どうするんだい？」から
    await R('どうするんだい？');
    const give = await choose(['2{個|こ}あげる', '自分で{好|す}きな数を食べる']);
    if (give !== '2{個|こ}あげる') { await selfish(); return; }   // 研究員は 出た まま つぎの 質問へ
    await labCut(false);   // このあと 製作中の 所で おわる
    await H('そうだったのか…！\nじゃあ今からわたしに行って、いっしょに食べよう。');
    await KA('うん！ありがとう！', 2);
    // 階段へ（プレイヤーが 歩く。子供Aは 先に 階段へ）
    await Promise.all([sitHero(null, 0, 0, 0, 0, 400), sitDown(kidA, 0, 400)]);
    rw(toB());                                               // 時計で 戻れる：研究員の「どうするんだい？」へ
    // 主人公は 自分の 一切れを、リアオは 自分のと シィの 分の 2切れを お盆に のせて 持つ
    pickDish(0); heroHoldDish(true);
    await bendPut(kidA, () => { pickDish(1); cakeTake(); prop('kidPlates', true); prop('traySlices', true); }, 900);
    walkPath(kidA, [[-1.9, -12.0], [0.5, -8.4], [5.6, -8.6], [5.6, -12.4]], 2.4);
    await freeWalk('stairs');
    watchPoint(null);
    await fadeOut('black', 700);

    // ---------- ○登った 先の 部屋の 扉の 前 ----------
    place('attic');
    cake('hidden'); prop('kidPlates', true); heroHoldDish(true);
    setHero(10.6, -11.6); heroFace(6.7, -12.9);
    sitActor(kidA, 7.8, -12.9, -Math.PI / 2);
    look(8.6, -11.8);
    await fadeIn(700);
    await KA('シィ～？おやつ持ってきたよ！', 1);
    await KB('やった！ありがとう。', 2);
    await KA('ケーキを切ってくれたお兄さんも\nいるんだけど、', 1);
    await KA('いっしょに入っていいかな？', 1);
    await KB('いいよー！', 2);
    await openDoor('attic', 900);

    // ---------- ○屋根裏部屋 ----------
    sitActor(kidB, .68, -9.3, 0);
    look(1.4, -8.2);
    await Promise.all([walkPath(kidA, [[5.4, -12.9], [-.6, -8.6]], 2.4), (async () => { await wait(500); await walkHeroPath([[7.6, -12.9], [5.4, -12.9], [2.6, -8.9]], 2.4); })()]);
    lookAt(kidB, heroX(), heroZ()); heroFace(kidB.x, kidB.z); lookAt(kidA, kidB.x, kidB.z);
    await KB('こんにちは。', 1);
    await H('こんにちは。');
    // 子供Aが おやつを ローテーブルに 置く
    await walkActor(kidA, -.4, -7.7, 600); lookAt(kidA, .68, -6.25);
    await bendPut(kidA, () => { prop('kidPlates', false); atticPlates(2); });   // リアオと シィの 分
    lookAt(kidA, kidB.x, kidB.z); lookAt(kidB, kidA.x, kidA.z);                // シィは リアオの ほうを むいて 話す
    await KA('これ、お兄さんが切ってくれたの。', 2);
    await KB('へぇー！すごくきれいに切れてる！', 3);
    await KA('おいらも切ろうとしたんだけど、\nまた{上手|うま}くできなくて…。', 1);
    await KA('お兄さんが助けてくれたんだ！', 2);
    await KB('前まで切ろうともしなかったじゃない！\n一歩前進だよ！', 3);
    await KA('へへっ。', 2);
    await H('なんの話をしているんだ？');
    await KA('あっ。\nおいら、自分の力のコントロールができないんだ。', 1);
    await H('力のコントロール？');
    await KA('{例|たと}えば、さっきのナイフとか何かを持つときに、正しい力の{加減|かげん}がわからないんだ。', 1);
    await KA('でも、今日はおいらの{誕生日|たんじょうび}だから、\n力に{変化|へんか}が起きてないかって思って', 2);
    await KA('チャレンジしちゃった。', 2);
    await H('{力加減|ちからかげん}がわからない…。');
    await KA('だから、お兄さんが助けてくれて{良|よ}かった！', 2);
    await H('ううん。けががなくてよかったよ。\nいっしょに食べて{誕生日|たんじょうび}のお{祝|いわ}いをしよう。');
    await say('2人', 'うん！');
    // 3人で 談笑しながら 食べる
    // テーブルを かこんで すわる
    look(.7, -6.6);
    await Promise.all([
      walkPath(kidA, [[-2.0, -7.6], [-2.0, -6.25]], 1.6).then(() => { lookAt(kidA, .68, -6.25); return sitDown(kidA, .03); }),
      walkPath(kidB, [[.68, -7.9]], 1.4).then(() => { kidB.rot = 0; return sitDown(kidB, .03); }),
      walkHeroPath([[3.5, -7.6], [3.5, -6.25]], 1.6).then(async () => {
        heroFace(0, -6.25); showPlate(2); heroHoldDish(false);              // 主人公の 一切れを テーブルに 置いて
        await sitHero(3.5, -6.25, 0, -6.25, -.42, 600);                    // 座布団に 座る
      }),
    ]);
    await eatPlates();                                                     // 一口ずつ 食べる
    await wait(500);
    // 食べ終わりの 頃
    await KA('えー！お兄さんずっとここにいるわけじゃないの？', 3);
    await H('うん。この世界から出なきゃ行けないんだ。');
    await KA('この世界？{別|べつ}の世界があるの？', 1);
    await KB('…。', 1);
    await KA('おいらたちもいつか新しい{景色|けしき}を見れたらいいね！', 1);
    await KB('うん…。', 1);
    await H('この世界から出るためのかぎを{探|さが}しているんだ。');
    await H('かいとうさんからは、そのかぎは「⟦星⟧」だって\n聞いた。');
    await KA('カイトウ？', 1);
    await H('お、オーナーさん！');
    // リアオが 首元に 隠していた 星の ネックレスを 手に 取って 見せる
    lookAt(kidA, heroX(), heroZ());
    look(-1.0, -6.4, .7, false, 'slow');                                   // ゆっくり 寄る
    await KA('おいら、オーナーさんからもらった⟦星⟧を持ってるよ！お兄さんが{探|さが}してるのってこれ？', 3);
    await showStar();
    await H('⟦星⟧だ…！');
    await KA('お兄さんになら、おいらこれあげてもいいよ！', 2);
    await H('本当か？');
    await KA('うん！お兄さん、ケーキ切る時も{優|やさ}しくしてくれたし、おいらがケーキ2つ持って行こうとしたら、おこるんじゃなくて話を聞いてくれたし。', 2);
    await KA('今日会ったのが{信|しん}じられないくらい、\nお兄さんといると落ち着くんだ！', 2);
    await KA('お兄さんのこと{大好|だいす}きだから、\nあげる！', 2);
    look(.7, -6.6, 1, false, 'slow');                                      // 3人が 見える アングルに もどす
    await H('ありがとう。');
    await wait(700);                                                       // 主人公が 見えてから 渡す
    await giveStar();
    note('⟦星⟧を 1つ 手に いれた！'); addStar();
    await wait(600);
    hideStar();                                                            // 受け取ったら しまう
    await KA('また会えたらいいね。', 2);
    await KB('でも、お兄さんにはお兄さんの世界があるんでしょ。会えないかもしれない。', 1);
    await KA('そっかぁ。{残念|ざんねん}だな。', 1);
    await KA('じゃあ、お兄さんのこと一生{忘|わす}れないようにする！', 2);
    await KB('うん。', 1);
    await H('ありがとう。');
    await KB('次はどこに行くの？', 1);
    const next = await choose(['分からない', '教えて{欲|ほ}しい']);
    if (next === '分からない') await H('分からない…。');
    else await H('次に行く所を、教えて{欲|ほ}しい。');
    await KB('お兄さんは⟦星⟧を集めているんだよね。\nそうしたら、{海辺|うみべ}に行くといいよ。', 1);
    await H('{海辺|うみべ}？');
    await KB('この部屋のドアから屋上に出て、{降|お}りた先の花道をたどれば、{海辺|うみべ}に着くよ。', 1);
    await H('そうか。行ってみるよ。');
    await KA('おいらは{片付|かたづ}けをしておくから、\nシィが少し先まで{案内|あんない}してあげなよ！', 1);
    await KA('今日のおいらはなんだかできる気がする！', 2);
    await KB('え？', 3);
    // 子供Aが 立ち上がって、3枚の お皿を ゆっくり 集める
    await sitDown(kidA, 0, 500);
    //   テーブルを まわりこんで、手前から 1枚ずつ（机を 通りぬけない）
    await walkPath(kidA, [[-2.0, -4.75], [-.42, -4.75]], 1.2); lookAt(kidA, -.42, -6.25);
    await bendPut(kidA, () => { takePlate(0); prop('kidPlates', true); prop('traySlices', false); }, 1100);
    await walkActor(kidA, .68, -4.75, 700); lookAt(kidA, .68, -6.75);
    await bendPut(kidA, () => takePlate(1), 1100);
    await walkActor(kidA, 1.78, -4.75, 700); lookAt(kidA, 1.78, -6.25);
    await bendPut(kidA, () => takePlate(2), 1100);
    lookAt(kidA, heroX(), heroZ());
    await wait(500);
    await KA('ほら！持てた！{洗|あら}い物をしちゃうぞー！へへっ。', 2);
    await KA('シィはここら{辺|へん}のことたくさん知ってるから、\nきっとお兄さんも安心できるよ！', 3);
    await KA('あと、お兄さんともう会えないなら、今のうちにたくさん話さなくちゃ。', 3);
    await KA('おいらはたくさん話したけど、\nシィはまだ少ししか話してないでしょ？', 3);
    await KB('あぁ…。', 3);
    await KB('じゃあ、わたしが{案内|あんない}するよ。', 1);
    await H('ありがとう。');
    heroFace(kidA.x, kidA.z); lookAt(kidA, heroX(), heroZ());
    await KA('お兄さん！じゃあね！', 2);
    await KA('おいらのこと、{忘|わす}れないでね！', 2);
    await H('うん。バイバイ。');
    // 子供Aに 見送られて、部屋の 片隅の ドアから 屋上へ（子供Bが 先に 扉を 開けて 出る。主人公は プレイヤーが 歩く）
    await Promise.all([sitHero(null, 0, 0, 0, 0, 400), sitDown(kidB, 0, 400)]);
    await toRoof();
    return;

    async function toRoof() {
      kidA.track = true;                                                   // リアオは その場で 主人公を 目で おって 見送る
      (async () => {
        await walkPath(kidB, [[-2.4, -7.9], [-5.4, -4.6], [-6.0, -1.6]], 1.6);
        await openDoor('exit', 700);
        await walkActor(kidB, -7.7, -1.6, 700); kidB.visible = false;
      })();
      rw3([toS(), toA(), toC()], [toS(), toA(), toD()]);       // 時計で 戻れる：はじめから ／ ケーキを 切る 場面 ／ ケーキを 食べる 場面
      await freeWalk('exit');
      watchPoint(null);
      await fadeOut('black', 900);
      end('場面2 おわり\n\n（つぎは 場面3「夜空に近い屋上」）');
    }

    // ---------- 場面2で くりかえし 使う できごと ----------
    // テーブルの どこに いても、テーブルを まわりこんで 主人公の 椅子（右の 手前から 3つ目）へ
    function toChair() {
      const pts = [], x = heroX(), z = heroZ();
      if (z < -12.9) { const side = x < 0 ? -2.3 : 2.3; pts.push([side, z], [side, -12.7]); }
      pts.push([2.2, -12.7], [2.2, -14.45], [1.75, -14.45]);
      return pts;
    }
    // 何こに 切るか えらんで、その 数の ケーキを 切る ミニゲーム（❶8個切る ❷好きな数を切る）
    async function cutByChoice() {
      const c = await choose(['8{個|こ}切る', '{好|す}きな数を切る']);
      let n = 8;
      if (c === '{好|す}きな数を切る') n = await writeMemo({ number: true, min: 2, max: 16, label: '何こに 切る？（2～16）', autoNumber: 6 });
      cutN = n;
      prop('badCut', false);
      await cakeGame(n);
      cakeSliced(n);
    }
    // 子供Aが ナイフを 受けとって 切る が、うまく いかない
    async function kidTries() {
      prop('heroKnife', false); prop('kidKnife', true); prop('tears', false);
      cakeReset();
      await walkHero(12.0, -12.2, 500);
      await walkActor(kidA, 13.2, -13.3, 500); lookAt(kidA, 14.72, -13.57);
      heroFace(kidA.x, kidA.z);
      await KA('この家には、おいらの他に5人の子と、\nお兄さんとオーナーさんがいるから、', 2);
      await KA('8{個|こ}に切らなきゃ！', 2);
      await KA('まずは真ん中を切ればいいんだよね？', 2);
      await KA('そ、それっ！', 2);
      await kidChop(700);
      prop('badCut', true);
      await KA('あ、あれ…。', 1);
      lookAt(kidA, heroX(), heroZ());
      prop('tears', true);
      await KA('今のおいらならできると思ったんだけどな…。\nやっぱりお兄さんが切ったほうが{良|よ}かったんだ。', 4);
    }
    // リアオが ケーキを 持って ゆっくり 2階へ 向かう（とちゅうで 止められたら 止まる）
    function riaoLeaves(resume) {
      const st = { stopped: false };
      st.done = (async () => {
        look(1.8, -10.4, 1.75, false, 'slow');                            // 登場した 時の ように 画面全体を ゆっくり 引く
        if (kidA.lift) await sitDown(kidA, 0, 400);
        let path = [[-2.2, kidA.z], [-2.2, -12.0], [0.5, -8.4], [5.6, -8.6], [5.6, -12.4]];
        if (resume) {                                                    // 止められた 所から、まだ 通って いない 道だけ 進む
          if (kidA.x > 5.0) path = [[5.6, -12.4]];
          else if (kidA.x > .3 && kidA.z > -9.2) path = [[5.6, -8.6], [5.6, -12.4]];
          else if (kidA.z > -12.05) path = [[.5, -8.4], [5.6, -8.6], [5.6, -12.4]];
          else path = [[-2.2, -12.0], [.5, -8.4], [5.6, -8.6], [5.6, -12.4]];
        }
        await walkPath(kidA, path, 2.2);                                 // 早足で
        if (!st.stopped) { kidA.visible = false; look(0, -14.5, 1, false, 'slow'); }   // 2階へ 行ったら もどす
      })();
      return st;
    }
    // リアオが 去ったあと：（研究員の ひとりごと と タップ）→ 2階の 物音 → 家の 中を 自由に 歩く
    async function afterRiaoLeaves(st, remark, three, trusted) {
      if (remark) {
        await labCut('talk');
        if (three && trusted) {                                         // ❸（…。）で 2つ 持って いくのを ゆるした ときは 問いかける
          await R('この{子供|こども}がうそをついていたらどうする？');
          await writeMemo({ label: 'この{子供|こども}が うそを ついて いたら どうする？' });
          await R('ふむ。なるほどねぇ。');
        } else {
          await R('{子供|こども}は{謝|あやま}らないんだね。');
          if (!three) await R('うそをついたことを\n{自覚|じかく}していないのかな？');   // ❸（…。）の ときは 言わない
          await R('おっとごめん！{独|ひと}り言が入ってしまった。');
        }
        await labCut(false);
        // 去っていく 子供を タップするか どうかは プレイヤー しだい（いなくなったら もう タップできない）
        //   ❸（…。）の ときは タップして とがめる ことは できない
        const tapped = st.stopped || three ? (await st.done, false) : await tapUntil(TAP.kidBody, '', st.done);   // わっかの エフェクトだけ（文字なし）
        if (tapped) {
          st.stopped = true; sitActor(kidA, kidA.x, kidA.z, 0); lookAt(kidA, heroX(), heroZ());
          await KA('な、なんだい？', 3);
          await H('うそをついたんだ。何か言うことはないか？');
          await KA('うそなんて大げさな！\n人数なんてたいしたことないだろ！', 1);
          await KA('まちがえただけだ！', 1);
          await labCut('talk');
          await R('…。');
          await labCut(false);
          const how = await choose(['{優|やさ}しく落ち着かせる', '同じ{態度|たいど}で言い返す']);
          if (how === '{優|やさ}しく落ち着かせる') await H('落ち着いて。小さなことでも、うそはダメだよ。それだけわかってくれればいいんだ。');
          else await H('人をだますような間ちがいはダメだ！\nそんなものはうそ{同然|どうぜん}だ！');
          await KA('…。なんでうそはダメなの？', 1);
          await labCut('talk');
          await R('お、リアオから{質問|しつもん}が来るとは。');
          await labCut(false);
          const ans = await writeMemo({ label: 'リアオに こたえる（なんで うそは ダメ？）' });
          await H(ans);
          await KA('フゥン…。ご、ごめんなさい。', 4);
          const again = riaoLeaves(true); await again.done;   // 机には もどらず 階段へ
          if (brought === 1) {                                           // 1つだけ 持って いった ときは 引き止めても「静かになったね」
            await labCut('talk');
            await R('{静|しず}かになったね。');
            await labCut(false);
          }
        } else {
          await labCut('talk');
          await R('{静|しず}かになったね。');
          await labCut(false);
        }
      } else await st.done;
      // 何こ 食べるかを 書く。手前の お皿の 1つを ふくめた 数（5こ なら お皿の 1つ ＋ ホールケーキから 4切れ）
      const onDish = dishCake(0) ? 1 : 0, total = cakeLeft() + onDish;
      if (total > 0) {
        const n = await writeMemo({ number: true, min: 1, max: total, label: `何{個|こ}食べる？（1～${total}）`, autoNumber: Math.min(2, total) });
        if (onDish) await eatDish(0, 700);
        await eatSlices(n - onDish, 700);
        await wait(600);
      }
      await H('ふぅ。美味しかったな。');
      await say('', 'ガシャーン！');
      await H('今の音はなんだ？');
      await roamHouse();
    }
    // 家の 中を 自由に 歩く。玄関ドアの 前と 2階の 階段前で「この先に行きますか？」
    async function roamHouse() {
      rw3([toB()], [toE()]);                                   // 食べ終わって 立ち上がった：研究員の「どうするんだい？」（「…。」は「どうする…？」）へ 戻れる
      const where = await roam([{ name: 'door', x: 0, z: -.9, r: 1.0 }, { name: 'stairs', x: 6.3, z: -11.5, r: 1.7 }], 'stairsAny');
      watchPoint(null);
      if (where === 'door') {
        await fadeOut('black', 600);
        // ○家の前の庭
        setOutfit(false); gardenSetup();
        await fadeIn(600);
        await say('', 'ガチャ。');
        doorCount++;
        if (doorCount === 1) {
          await O('おや？もう⟦星⟧は手に入ったのかい？', 'kaitou1');
          await H('！');
          await H('……。');
          await O('どうする？', 'kaitou1');
        } else await O('もういいのかい？', 'kaitou1');                       // 2回目からは これだけ
        const c = await choose(['先に進む', '家にもどる']);
        if (c === '先に進む') {
          await O('そうか。じゃあ左手にあるさくから次の花道に{続|つづ}いている。行ってらっしゃい。', 'kaitou2');
          await fadeOut('black', 900);
          end('場面2 おわり\n\n（このあと 場面4へ）');
          return;
        }
        await O('そうか。じゃあ2階へ行くといい。', 'kaitou1');
        await fadeOut('black', 600);
        // ○家の中
        place('home'); setOutfit(true); setHero(0, -2.4); heroFace(0, -5);
        await fadeIn(600);
        return roamHouse();
      }
      // ○屋根裏の廊下
      await fadeOut('black', 700);
      await atticHall();
    }
    // ○屋根裏の廊下 → 星が 割れて いた 部屋（家の中を 歩いて 階段を 上った 場合）
    async function atticHall() {
      place('attic');
      cake('hidden'); heroHoldDish(false); prop('kidPlates', false); sitHero(null);
      setHero(10.6, -11.6); heroFace(6.7, -12.9);
      atticPlates(brought, false); shards(true);                           // 中には 食べ終わった お皿と 星の かけら
      sitActor(kidA, -2.4, -10.0, Math.PI / 2); sitActor(kidB, .9, -10.4, -Math.PI / 2);
      look(8.6, -11.8);
      await fadeIn(700);
      await H('さっきの物音はここか？');
      await openDoor('attic', 900);
      // ドアを 開けると、{粉々|こなごな}に なった 星の まわりに 二人の 子供が いた
      look(0, -10.2);
      await walkHeroPath([[7.6, -12.9], [5.4, -12.9]], 2.4);
      lookAt(kidB, heroX(), heroZ()); lookAt(kidA, heroX(), heroZ());
      await KB('わぁ！お兄さんだれ！？', 3, '？？');
      await KA('お兄さん！入ってきたの？', 3);
      await walkHeroPath([[3.4, -10.6]], 2.0); heroFace(-.6, -10.2);
      await H('さっきの物音はここから？…それは？');
      lookAt(kidA, kidB.x, kidB.z);
      await KA('{勝手|かって}に入ってきちゃダメだよ！\nシィ、だいじょうぶ？', 1);
      await KB('うん。オーナーじゃなくてびっくりしちゃったけど。', 1);
      await KA('そっか。よかった。', 2);
      lookAt(kidA, heroX(), heroZ());
      await H('？');
      await H('それで、その黄色いかけらは？');
      await KA('オーナーさんからもらった⟦星⟧だったんだけど、\n{割|わ}っちゃった…。', 4);
      await H('⟦星⟧！？');
      await KA('そう。⟦星⟧。', 1);
      await KA('お兄さんどうしたの？', 1);
      await labCut('talk');
      await R('これは君が{探|さが}していたものだね。\nでも{割|わ}れてしまったようだ。');
      await R('⟦星⟧が{必要|ひつよう}だったって{伝|つた}える？');
      rw3([toA(), toC()], [toA(), toD()]);                     // 時計で 戻れる：ケーキを 切る 場面 ／ ケーキを 食べる 場面
      const w = await writeMemo({ label: 'リアオに 何て 言う？', allowEmpty: true });
      watchPoint(null);
      await labCut(false);
      const k = wordKind(w);
      if (k === 'tell' || k === 'blame' || k === 'question') {             // 伝えようと する 内容（責める・たずねる 内容も ふくむ）
        await H(w);
        if (k === 'question') {                                            // たずねられた ときは とまどってから、オーナーさんに もらった 話を する
          await KA('え…？えーと。', 1);
          await KA('この⟦星⟧は、オーナーさんからもらったんだ。', 1);
          await KA('オーナーさんは、\nだれかにわたす時が来たらわたしてねって言ってたけど。', 4, { fit: true });
        } else if (k === 'blame') {                                               // 責められた ときは「そうだったの？」では なく あやまる
          await KA('ご、ごめんなさい…？', 4);
          await KA('{確|たし}かにオーナーさんは、\nだれかにわたす時が来たらわたしてねって言ってたけど。', 4, { fit: true });
        } else await KA('え？そうだったの…？{確|たし}かにオーナーさんは、\nだれかにわたす時が来たらわたしてねって言ってたけど。', 4, { fit: true });
        await KA('そんな時来ないと思ってた…。ごめんなさい。', 4);
        lookAt(kidB, heroX(), heroZ());
        await KB('それは⟦星⟧の形をしていなきゃダメなの？', 1);
        await H('え？');
        await KB('{粉々|こなごな}でも元は⟦星⟧だし、\nオーナーがそう言っていたなら、', 1);
        await KB('どんな形でも{意味|いみ}があるんじゃない？', 1);
        await labCut('talk');
        await R('そうなのかなぁ？どんな思考をしているんだこの子は。もらっておく？');
        await labCut(false);
      } else if (k === 'abuse') {                                          // ばとうする 内容
        await H(/[！!]$/.test(w) ? w : w + '！');
        await KA('ご、ごめんなさい！', 4);
        lookAt(kidB, heroX(), heroZ());
        await KB('ちょっと。どんな{事情|じじょう}があるかわからないけど、お客さんでもそれは{見過|みす}ごせないよ。', 1);
        await KB('⟦星⟧が{必要|ひつよう}だったの？', 1);
      } else {                                                             // 無言の 内容
        await H(w && !/^[…・.。、\s]*$/.test(w) ? w : '…。');
        lookAt(kidB, heroX(), heroZ());
        await KB('⟦星⟧が{必要|ひつよう}だったの？', 1);
      }
      const keep = await choose(['⟦星⟧の形であることが大事', 'もらう']);
      if (keep === 'もらう') {
        await H('あぁ。{必要|ひつよう}だ。');
        await KB('…そう。じゃあこんな{状態|じょうたい}でもわたすわよ。', 1);
        await KB('オーナーがリアオにわたしたのも、{意味|いみ}があったんだろうし。', 1);
        // シィは 手を 血だらけに しながら かけらを 集めて、わたす
        await walkActor(kidB, -.1, -10.2, 500); lookAt(kidB, -.6, -10.2);
        await bendPut(kidB, null, 1200);
        await bendPut(kidB, null, 1200);
        lookAt(kidB, heroX(), heroZ());
        await giveShards();
        note('⟦星⟧の かけらを 手に いれた！'); addStar();
        await wait(600);
      } else {
        await H('いや。“⟦星⟧”が{必要|ひつよう}なんだ。\nくだけたものはいらないよ。');
        await KB('…そう。', 1);
      }
      lookAt(kidB, heroX(), heroZ());
      await KB('お兄さん、ここに住むわけではなくお客さんなんでしょ？次はどこかにいくの？', 1);
      const nx = await choose(['分からない', '教えて{欲|ほ}しい']);
      if (nx === '分からない') await H('分からない…。');
      else await H('次に行く所を、教えて{欲|ほ}しい。');
      await KB('お兄さんは⟦星⟧を集めているんでしょ。\nそうしたら、{海辺|うみべ}に行くといいよ。', 1);
      await H('{海辺|うみべ}？');
      await KB('この部屋のドアから屋上に出て、{降|お}りた先の花道をたどれば、{海辺|うみべ}に着くよ。', 1);
      await H('そうか。行ってみるよ。');
      await KA('シィはここら{辺|へん}のことをたくさん知っているんだよ。そうだ、せっかくだしシィが{案内|あんない}する？', 2);
      await KB('え？あぁ……。', 3);
      await KB('じゃあ、わたしが{案内|あんない}するよ。', 1);
      await H('うん。');
      await toRoof();
    }
    // 書き込んだ ことばの しゅるい：'tell'（伝える）・'blame'（責める）・'abuse'（ばとう）・'silent'（無言）
    //   ことばの リストで 見分ける（インターネット なしでも 動く）。上から じゅんに 調べる
    function wordKind(t) {
      const ABUSE_RE = /なにやって|何やって|ばか|バカ|馬鹿|ふざけ|さいあく|最悪|さいてい|最低|ざけん|うるさ|うざ|ウザ|だまれ|黙れ|ゆるさな|許さな|ゆるせな|許せな|どうしてくれ|なんてこと|アホ|あほ|まぬけ|マヌケ|ドジ|どじ|ひどい|ひどすぎ|しね|死ね|ころす|殺す|くそ|クソ|ボケ|ぼけ|おまえ|お前|てめ|いいかげん|いい加減|ありえな|あり得な|きらい|嫌い|じゃま|邪魔|役立たず|やくたたず|使えな|つかえな|出ていけ|でていけ|消えろ|きえろ/u;
      const BLAME_RE = new RegExp([
        '(なんで|なぜ|何で|どうして).*(割|わっ|わる|われ|こわ|壊|落と|おと|した|しちゃ|やっ)',   // なんで割ったんだ
        '割(っ|る|ら)', 'わっちゃ', 'わるな', 'わらないで', '(?<![かおさまこけしあ\\p{Script=Han}])わった',          // 割った・割るな
        '壊(し|す|さ)|こわし|こわす|こわさ', '落とし|おとし|落とす|おとす|落とさ|おとさ',
        '(大事|だいじ|大切|たいせつ)な', 'せっかく', 'もったいな', '台無し|だいなし', 'がっかり', '残念|ざんねん',
        '困る|こまる|困った|こまった', '返して|かえして', 'べんしょう|弁償', 'せきにん|責任',
        '気をつけ|きをつけ', 'ちゃんと', 'しっかり', '(だめ|ダメ)(じゃない|だろ|でしょ)', '何してる|なにしてる|何してんの|なにしてんの',
        'のに[。！!…\\s]*$',                                            // 必要だったのに
      ].join('|'), 'u');
      t = String(t || '');
      if (!t.replace(/[\s。、．.…・！!？?ー～〜「」]/gu, '')) return 'silent';
      if (ABUSE_RE.test(t)) return 'abuse';
      if (/^(なんでもない|何でもない|なんでも ない|べつに|別に|なにも|何も|いや|ううん|大丈夫|だいじょうぶ)[。！!…\s]*$/u.test(t.trim())) return 'silent';
      if (/いいよ|大丈夫|だいじょうぶ|気にしな|きにしな|しかたな|仕方な|しょうがな|けがは|ありがとう|ごめん/u.test(t)) return 'tell';   // ゆるす・気づかう ことばは 責めて いない
      if (BLAME_RE.test(t)) return 'blame';
      // たずねる 文：「？」で おわる、または「〜の」「〜か」「〜かな」で おわる
      if (/[？?]\s*$/u.test(t) || /(の|か|かな|なの|っけ)[。…\s]*$/u.test(t.trim())) return 'question';
      return 'tell';
    }
    // ②自分で好きな数を食べる を えらんだ 時
    async function selfish() {
      await labCut('talk');
      await R('この{子供|こども}に、自分はお{腹|なか}が{減|へ}っていることを{伝|つた}えるかい？');
      const t = await choose(['{伝|つた}える', 'やめておく']);
      await labCut(false);
      let st;
      if (t === '{伝|つた}える') {
        const w = await writeMemo({ label: 'リアオに {伝|つた}える' });
        await H(w);
        await KA('そっか、わかった…。', 4);
        pickDish(1); prop('kidPlates', true); prop('trayOne', true); brought = 1;   // 1つの ケーキを 持って 2階へ
        st = riaoLeaves();
        await H('これで{好|す}きな数食べることができる。');
      } else {
        await H('だめだよ。{元々|もともと}言われた数で切っているんだから。');
        await KA('…。わかった。', 4);
        pickDish(1); prop('kidPlates', true); prop('trayOne', true); brought = 1;
        st = riaoLeaves();
      }
      await afterRiaoLeaves(st, true);
    }
    // ❸ を えらんだ 時：ひとりで テーブルへ。あとから リアオが 来る
    async function threeTable(from) {
      if (!from) {
      await H('できた。{机|つくえ}に運ぼう。');
      watchPoint([toA()]);                                      // 時計で 戻れる：リアオが 来る ところへ
      prop('heroKnife', false); prop('carry', true); cake('carry');
      await freeWalk('table');
      heroFace(0, -15.5);
      await tapAt(TAP.table, 'タップして おく');
      watchPoint(null);
      prop('carry', false); cake('table');
      // すみで ふるえて いた リアオが テーブルへ 来る
      kidA.shiver = false; prop('tears', false);
      if (!kidA.visible) sitActor(kidA, -2.45, -9.0, Math.PI);
      await walkPath(kidA, [[-2.3, -11.6], [-1.6, -13.2]], 2.6); lookAt(kidA, 0, -15.5);
      await KA('お、お兄さん！ケーキ切ってくれてありがとう。', 1);
      await H('うん。');
      await KA('おいらも食べていい？', 2);
      await H('うん。');
      // 主人公と リアオは 椅子に 座る。まずは 切った ケーキを お皿に のせて 机に おく（主人公の 前に 1つ、リアオの 前に 2つ）
      //   主人公は まだ 食べない。リアオも ケーキを 手に 持たない
      look(0, -14.5);
      await Promise.all([
        walkHeroPath(toChair(), 2.0).then(() => sitHero(1.32, -14.45, 0, -14.45, -.15, 500)),
        walkPath(kidA, [[-2.2, -14.45], [-1.6, -14.45]], 1.6).then(() => { sitActor(kidA, -1.41, -14.45, Math.PI / 2); return sitDown(kidA, .18); }),
      ]);
      }                                                          // ←ここまで 'D'・'E' から 戻った ときは とばす
      if (from !== 'E') {
      await serveSlice(0);
      await serveSlice(1);
      await serveSlice(1, true);
      await wait(400);
      }
      await labCut('talk');
      await R('この{子供|こども}！2{個|こ}とったぞ！どうする…？');
      const c = await choose(['注意する', '{無視|むし}する']);
      await labCut(false);
      let trusted = c !== '注意する';                                    // 2つ 持って いかせた（無視した、または 注意した あと 信じた）
      if (c === '注意する') {
        await tapAt(TAP.kidHand, 'タップ');                                 // 2つ目を 取ろうと する 手を
        await KA('いてっ！', 1);
        await H('人数分で切っているから、1人1{個|こ}までだよ。');
        await KA('と、{友達|ともだち}にわたしに行こうと思って…。', 1);
        await labCut('talk');
        await R('{本当|ほんとう}かな？');
        let ok = await choose(['{信|しん}じる', '{疑|うたが}う']) === '{信|しん}じる';
        await labCut(false);
        if (!ok) {
          await H('{本当|ほんとう}か？');
          await KA('{本当|ほんとう}だよ！\nピンクの見た目をしたおいらと同じ年の子だよ！！！', 4);
          await KA('その子は部屋から出られなくて…。', 4);
          await labCut('talk');
          await R('どうするんだい？');
          ok = await choose(['{信|しん}じる', '{信|しん}じない']) === '{信|しん}じる';
          await labCut(false);
        }
        trusted = ok;
        if (ok) {                                                           // 信じた 場合
          await H('そうか。');
          await KA('うん…。じゃあ、持っていくね。', 1);
        } else {                                                            // 信じない 場合：1つだけ 持って いく
          await H('だめだ。');
          await KA('そっか。じゃあ、1つだけ持っていくことにするよ。', 1);
          await bendPut(kidA, () => dishBack(1), 900);                     // リアオが お皿の 1つを ホールケーキに もどす
          brought = 1;
        }
      }
      // リアオは ゆっくり ケーキを 持って、その場から ゆっくり 去る。主人公は 黙々と ケーキを 食べる
      pickDish(1); prop('kidPlates', true); prop(brought === 1 ? 'trayOne' : 'traySlices', true);   // お皿ごと 持って いく
      const st = riaoLeaves();
      await afterRiaoLeaves(st, true, true, trusted);                       // どの 場合も 研究員の ひとりごとへ 合流（とがめる ことは できない）
    }
  },
};
