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

const STORY = {
  // 場面1 の 地図（田野さんの「スターとマップ」より。100px = 1m、y は 上へ いくほど 小さい）
  //   下から：目を覚ます 部屋 → 仕切り（まんなかに 出入口）→ 植木の ある 長い 通路（バケモノの 場面）
  //          → 階段（3m 上る）→ 柵に かこまれた 家の前の 広場 → 家（アーチの ドア）
  map: {
    floorLeft: 255, floorRight: 948,     // 通路の かべの 内がわ
    walkLeft: 300, walkRight: 905,       // 両わきに 植木が あるので 歩けるのは 少し 内がわ
    floorBottom: 5990,                   // 目を覚ます 部屋の 下の かべ
    corridorTop: 1435,                   // ここから 上は 階段
    stairsTop: -80, stairsRise: 3,       // 階段を 上りきった 所（家の前の 広場の 手前の はし）
    plazaTop: -1034, plazaLeft: -1015, plazaRight: 1695,   // 家の前の 広場（柵の 内がわ）
    houseFront: -723,                    // 家の 前の 面（ドアの まんなかは x 600 あたり）
    monsterY: 2555,                      // バケモノの 場面
    walls: [                             // 目を覚ます 部屋の 仕切り（まんなかに 出入口）
      { x1: 255, x2: 533, y1: 4713, y2: 5025 },
      { x1: 670, x2: 948, y1: 4713, y2: 5025 },
    ],
  },
  playerStart: { x: 603, y: 5792 },
  walkSpeed: 330,
  runSpeed: 520,                      // 2周目は 走る

  autoSpeed: 4,
  autoChoices: [
    'この場に残る',                    // つぎは 左の「助けに行く」
    'ヘッドホンのコード',
    '3つ隣の街で…。', '巻き戻す',      // 巻き戻すと 家を 答える 選択肢に もどる
    'すぐそこです。', '逃げる',
    '出たいと伝えない',
    '嘘をつく', '代わりに切る',        // 場面2：子供Aが 切りそこねて、代わりに 切る
    '分からない',
  ],

  // ---------- ○ホーム画面の ナレーション（「始める」を 押したあとに 流れる） ----------
  //   ナレーションは 画面を 暗くして 白い 文字で まんなかに 出る。研究員は 研究室の カットで 話す
  home: async () => {
    await say('ナレーション', 'これはとあるロボットが、\n人間を研究するために作ったゲーム「スターと」です。');
    await say('ナレーション', '長いこと起動されるのを待っています。\n遊んであげましょう。');
    labCut('talk');
    await say('研究員', 'やっと電気がついた！どんなデータが取れるか楽しみだなぁ！');
    await say('研究員', 'こっそりここから見ていよう！');
    labCut(false);
  },

  // ---------- ○何もない部屋 ----------
  opening: async () => {
    flags.loop = 1;
    await fadeOut('black', 0);
    await wait(600);
    await STORY.home();
    await wait(400);
    await say('ナレーション', 'あなたはいつのまにか眠ってしまったようですね。この夢の世界から脱出をしましょう。');
    note('ここは「主人公の一人称の動画」が入る予定（数回瞬きをし、起き上がる）');
    await blink();
    await say('主人公', '眠っていたのか…？まだ目が覚めきらないが、とにかくここを出なくては。', { face: 'heroSleepy' });
    // 【プレイヤーが操作し、自由に歩く。】
  },

  triggers: [
    {
      // 主人公が 歩き出した 瞬間、人物Aの 声が 聞こえる
      id: 'voice',
      when: () => walked() > 30,
      if: () => flags.loop === 1,
      run: async () => {
        show('exclaim');
        await say('???', 'おーい！誰かいるのか？\n助けてくれー！');
        hide('exclaim');
        // 助けに行くか 迷う
        //   ②この場に残る：人物A「助けてってばー！」と 何度も 聞こえる。
        //   2回 つづけて ② を えらぶと、①助けに行く だけが 出る
        let stay = 0;
        while (true) {
          if (stay === 0) await say('主人公', '…？', { face: 'hero' });
          const c = await choose(stay >= 2 ? ['助けに行く'] : ['助けに行く', 'この場に残る']);
          if (c === '助けに行く') break;
          stay++;
          show('exclaim');
          await say('???', '助けてってばー！');
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
        await say('???', '早くこいつを…！うっ。', { face: 'kaitou5' });
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
        await say('主人公', 'なんだ！？と、時計なんて持っていたか？', { face: 'hero' });
        await stopAlarm();                                                  // 止めるように さそう エフェクト
        hide('ring');
        await wait(300);
        hide('watch');
        await fadeOut('white', 500);                                        // 目の前が 光に 包まれる
        await say('主人公', 'ッ！？', { face: 'hero' });

        // ---------- ○何もない部屋（再び 目を 開けると、眠りから 目を覚ました 部屋） ----------
        flags.loop = 2;
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
        await say('主人公', '（やっぱり同じ人だ。\nさっきより早く着けたのか？）', { face: 'hero' });
        await say('主人公', '（まだ食われていないような…。）', { face: 'hero' });
        await say('???', 'こいつをやっつけてくれ！', { face: 'kaitou5' });
        await say('主人公', 'やっつける！？\nどうすればいいんだ？', { face: 'hero' });
        await choose(['カセットテープ', 'ヘッドホンの\nコード', 'リュック\nそのもの'], { speaker: '主人公の荷物' });
        await say('主人公', 'これを使うのか…？\nッえい！', { face: 'hero' });   // （動揺した表情）
        await throwItem();                                                  // 顔を 苦くしながら 投げ、追い払う
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
        await say('???', '助けてもらったところ申し訳ないが、\n急いでるんだ！', { face: 'kaitou5' });
        await say('???', 'またいつか会えたら\n必ずお礼をするよ！', { face: 'kaitou5' });
        await say('???', '本当にありがとう！', { face: 'kaitou5' });
        await captiveWalk(136, -750, 2000);                                  // 清らかな 笑顔で 礼を 伝え、すぐに 去る
        monster('none');
        await say('主人公', 'あぁ…。', { face: 'hero' });
        await say('主人公', '（というか、どうなっているんだ？\n同じことが2回も起きている…。）', { face: 'hero' });

        // ---- 警察 ----
        await wait(800);                                                    // 奥の方から ドタバタと 物音
        await say('?', '…ここに…だ…がすな！');
        await say('主人公', '？', { face: 'hero' });
        await wait(2000);                                                   // 2秒後に 警察が 現れる
        police('police');
        await policeWalk(0, 710, 1800);
        await say('警察', 'おいそこの君！ここらへんで\n事件が起きたと聞いたが、');
        await say('警察', '何か見なかったか！？');
        await say('主人公', '（早くここを出なくては\nいけないんだ…。）', { face: 'hero' });
        await say('主人公', '（面倒なことに\n巻き込まれたくはない。）', { face: 'hero' });
        await say('主人公', '事件…。知らないです。', { face: 'hero' });     // 目を 合わせずに

        // 警察に 家を 聞かれる 場面（③巻き戻す を えらぶと ここに もどる）
        let act, rewound = false;
        while (true) {
          await say('警察', 'そうか。最近物騒になってきたから\n気をつけろよ。');
          await say('警察', '…君、お家は？');
          if (rewound) {
            await say('主人公', '他の言い訳は…。', { face: 'hero' });   // 巻き戻した 時
          } else {
            await say('主人公', '（僕の家は…。）', { face: 'hero' });
            await say('主人公', '（どうしよう！すぐ答えなかったら\n怪しまれる！）', { face: 'hero' });
            await say('主人公', 'えーと。', { face: 'hero' });
          }
          const answer = await choose(['すぐそこです。', '3つ隣の街で…。', '…。']);
          await say('主人公', answer, { face: 'hero' });
          if (answer === 'すぐそこです。') await say('警察', 'ここら辺に登録されてる\n住宅地はないぞ。');
          else if (answer === '3つ隣の街で…。') await say('警察', 'ここは他の街の者は\n立ち入り禁止だぞ。');
          else await say('警察', '答えられないのか？');
          await say('警察', 'どういうことだ？君、\n少しだけ話を聞いても良いかな？');   // 動揺する 主人公を 怪しむ
          if (!rewound) {                                                   // 巻き戻した 時は 言わない
            await say('主人公', 'このままだとまずい！', { face: 'hero' });
            // 警察に 対しての 行動が 出たあと、画面に 透明度50%の 黒い 幕が はられ、研究員の カットが 入る
            await peekChoose(['戦う', '逃げる', '巻き戻す'], 1600);
            labCut('dim');
            await say('研究員', 'ワタクシはここで、「自分を守るため」か「早く脱出するためか」、何を優先して行動を選ぶのかを研究しているんだった！');
            await say('研究員', 'この行動は、大事なデータとして取らせていただこう。');
            labCut(false);
          }
          act = await choose(['戦う', '逃げる', '巻き戻す']);
          if (act !== '巻き戻す') break;
          // ③：警察に 家を 聞かれる 場面に 巻き戻される
          rewound = true;
          show('watch');
          await wait(300);
          await fadeOut('white', 300);
          hide('watch');
          await fadeIn(400);
        }
        if (act === '戦う') {
          await say('主人公', 'いっそ戦うか…！', { face: 'hero' });
          await walkTo(2830, 500);                                          // 警察に むかって 一歩
        } else {
          await say('主人公', '逃げろっ！', { face: 'hero' });
          await walkTo(3050, 500);                                          // 逃げようと する
        }
        labCut('memo');                                                     // 研究員が メモを する 仕草
        await wait(1800);
        labCut(false);
        show('gun');                                                        // 警察が 拳銃を 突きつける
        await say('主人公', '拳銃っ！？', { face: 'hero' });
        await wait(2000);                                                   // 主人公が 2秒 身構える
        await say('警察', 'パンッ！');
        await fadeOut('white', 80);                                         // 発砲する
        await fadeIn(300);
        show('flowers');                                                    // 銃弾では なく 花束が 出る
        await wait(2000);                                                   // 2秒ほど 固まる 主人公
        await say('主人公', '…？', { face: 'hero' });
        await say('警察', 'おいおい。\nなんか言ってくれよ。');
        await say('主人公', 'え？', { face: 'hero' });
        await say('警察', 'さっきは助けてくれてありがとう！');
        await say('主人公', '（さっき？誰だ？）', { face: 'hero' });
        hide('gun');
        hide('flowers');
        await policeTurn();                                                 // 体を 一周 まわすと、人物Aの 姿へ

        // ---- 怪盗 ----
        await say('主人公', 'さっきの！', { face: 'hero' });
        await say('怪盗', 'やっとわかってくれたか！', { face: 'kaitou2' });
        await say('主人公', '（でも、どういうことだ？\n襲われていた人が、）', { face: 'hero' });
        await say('主人公', '（警察に変装して、\n今度は撃とうとした…？）', { face: 'hero' });
        await say('怪盗', 'やれやれ。もっと驚いてくれよ。\n君はこの世界に初めて来たんだろう？', { face: 'kaitou3' });
        await say('怪盗', '心細いと思って、君を楽しませるために\n色々と用意したんだ！', { face: 'kaitou2' });
        await say('怪盗', '美味しい食事も、いろんな人との出会いも！\n最後にはとっておきのお楽しみが待っている。', { face: 'kaitou2' });
        await say('怪盗', '君、時計を持っているだろう？', { face: 'kaitou1' });
        show('watch');
        await say('主人公', 'あぁ、これ。\nこんなもの持っていなかったのに。', { face: 'hero' });
        await say('怪盗', 'ふふふ。', { face: 'kaitou2' });
        await say('怪盗', 'このアラームが鳴った時に\n自分で止めると時間を戻せるんだ。', { face: 'kaitou1' });
        await say('怪盗', '本当の人生をやり直すことは\nできないが、この世界ではそれが叶う。', { face: 'kaitou1' });
        await say('怪盗', 'どうだ？面白いだろう！？', { face: 'kaitou2' });
        hide('watch');
        await say('主人公', '時間を戻す…。\n確かにさっきは時が戻っていた。', { face: 'hero' });
        await say('主人公', 'この人は何か\n知っているのかもしれない。', { face: 'hero' });
        await say('怪盗', 'ぜひこの世界を楽しんでくれ！さぁ。行こう！', { face: 'kaitou1' });
        // 怪盗は 主人公を 置いて 走り出す。【プレイヤーの 操作】怪盗に ついていく
        await kaitouRunAhead();
        follow();
        flags.follow = true;
      },
    },
    {
      // 怪盗を 追って 階段まで 来たら、暗い 通路を 抜けて 家の前へ
      id: 'house',
      y: 1600,
      if: () => flags.follow,
      run: async () => {
        flags.follow = false;
        await fadeOut('black', 800);

        // ---------- ○怪盗の家の前（暗い通路を抜け、星空の もとに ポツンと 佇む 家） ----------
        police('none');
        place('house');
        const arrive = arriveHouse('follow');                               // 先に 着いた 怪盗の もとへ
        await fadeIn(900);
        await arrive;
        await say('怪盗', 'こんなに走ったのは久々だ！', { face: 'kaitou2' });
        await say('怪盗', '君を楽しませるはずが\n僕も楽しんでしまっているよ。', { face: 'kaitou2' });
        await say('怪盗', 'これからの出来事、\nどうか楽しんでくれ！', { face: 'kaitou2' });
        await say('主人公', 'ふふっ。うん。', { face: 'hero' });
        moonlight();                                                        // 月の光が 怪盗を 照らし、輝くような 笑顔に
        await wait(1500);                                                   // 一瞬 微笑む 主人公。次第に 顔が 暗くなる
        await say('主人公', '（あ…。でも、\n僕はこの世界から出たいんだった…。）', { face: 'hero' });
        const feel = await choose(['出たいと伝える', '出たいと伝えない']);
        if (feel === '出たいと伝える') {
          await say('主人公', '楽しませようとしているのは\n嬉しいが、助けて欲しいんだ。', { face: 'hero' });
          await say('怪盗', '助ける…？というか、\n君は無口な子だと思っていたよ。', { face: 'kaitou1' });
          await say('怪盗', '僕が変身した時も無反応だし、\n口数も少ないし…。', { face: 'kaitou1' });
          await say('怪盗', 'なぁんだ、素直に伝えられるじゃないか。\nそうか、人は見た目ではわからないね。', { face: 'kaitou2' });
        } else {
          await say('主人公', 'あぁ。楽しみだよ…。', { face: 'hero' });
          await say('怪盗', '…。', { face: 'kaitou4' });
          await say('怪盗', '本当に楽しみにしているのか…？', { face: 'kaitou4' });
          await say('怪盗', '何か言いたそうに\nしているように見えるが。', { face: 'kaitou4' });
          await say('怪盗', 'ごめんよ、きっと僕に\n合わせてくれたんだろう？', { face: 'kaitou3' });
          await say('怪盗', '素敵な優しさだが、\n自分を殺してはいけないよ。', { face: 'kaitou3' });
          await say('主人公', '殺す？', { face: 'hero' });
          await say('怪盗', 'ものの例えさ。自分の意見や\n感情を押さえ込んでまで、', { face: 'kaitou4' });
          await say('怪盗', '他人を優先すること。\n他人を想う優しさでもあるが、', { face: 'kaitou4' });
          await say('怪盗', '次第に自分が\nわからなくなるかもしれない。', { face: 'kaitou4' });
          await say('怪盗', '僕の前では\n自分を殺さなくていいさ。', { face: 'kaitou3' });
          await say('主人公', 'うん、わかった。\n…ここから出たい。', { face: 'hero' });
          await say('怪盗', 'そうか。出たいのか。', { face: 'kaitou1' });
        }
        // ここで ①と② が 合流
        await say('怪盗', 'そうだなぁ。\nこの世界から抜け出すには、', { face: 'kaitou1' });
        await say('怪盗', '扉を開ける鍵「星」を\n集める必要がある。', { face: 'kaitou1' });
        await say('怪盗', 'その星は、きっとこれから\n出会う人たちが持っているさ。', { face: 'kaitou1' });
        await say('主人公', '星を集める…。', { face: 'hero' });
        await say('怪盗', 'この家の中に、\n星を渡した子が一人いたはず。', { face: 'kaitou1' });
        await say('怪盗', 'まずは話してみるといい。', { face: 'kaitou2' });
        await enterHouse('open');                                           // 怪盗が ゆっくり ドアを 開ける
        await say('怪盗', 'さぁ、入って。', { face: 'kaitou1' });
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
    // 子供A（青い子）は 名前を 名のるまで「子供A」、名のった あとは「リアオ」。子供B は「シィ」
    //   KA(セリフ, 顔の番号) … 顔は 子供Aの アイコン 1〜4、KB は 子供Bの アイコン 1〜3
    let nameA = '子供A';
    const KA = (text, f) => say(nameA, text, { face: f && 'kidA' + f }), KB = (text, f) => say('シィ', text, { face: f && 'kidB' + f });
    const O = (text, face) => say('怪盗', text, { face });

    // ---------- ○緑が多い暖かな家の中 ----------
    place('home');
    setHero(0, -1.2); heroFace(0, -5);
    sitActor(owner, 1.0, -3.0, 0); lookAt(owner, 0, -1.2);
    await fadeIn(900);
    // 家に入ると 主人公の 姿が 変わる
    await wait(400);
    await fadeOut('white', 250); setOutfit(true); await fadeIn(500);
    await H('あったかい…。');
    await O('外は寒かったからね。星を集めるのも大変かもしれない。少しゆっくりしていくといい。', 'kaitou1');
    await H('うん。…あれ？こんな服着ていたか？');
    await O('あぁそれ。この家の中では、本当の姿を隠して過ごしているんだ。', 'kaitou1');
    await O('この家にいる子たちはみんなワケありだからね。見た目じゃなく、心で接せられるように。', 'kaitou1');
    await O('君も知らない世界に突然やってきたワケありさんだろう？', 'kaitou2');
    await H('ワケありさんか。へぇ。');
    await O('っと。早速で悪いが、僕はやることがあるから失礼するね！', 'kaitou5');
    await O('あぁ、あとキッチンにあるケーキは切って食べていいから！星は青い子が持っていたはず！', 'kaitou5');
    await O('子供達は僕のことをオーナーさんって呼んでるから、オーナーって言えば伝わると思うよ！じゃ！', 'kaitou5');
    // 怪盗は 奥の 裏口から 去る（主人公が 歩けるように なるまで カメラは そのまま）
    await walkPath(owner, [[0, -6.7], [-2.1, -9.5], [-2.1, -18.8], [0, -19.6]], 4.2);
    await openDoor('back', 300);
    await walkActor(owner, 0, -20.6, 300); owner.visible = false;
    await H('忙しい人だな…。');
    await H('でも、確かにワケありかも。他に行くあてもなかったし、帰る方法すら知らなかったし。');
    await H('これから頑張って脱出するんだ。');

    // ---------- ケーキの 前へ（プレイヤーが 歩く） ----------
    await freeWalk('cake');
    heroFace(14.72, -13.57);
    await H('ケーキってこれか。');
    await say('主人公のお腹', 'ぐるるるるぅぅぅ。');
    await H('腹の音がなってしまった…。食べてから星を探そうかな。まずはナイフで切らなくちゃ。');
    // キッチンの はしの ナイフを とって、ケーキの 前に もどる
    await freeWalk('knife');
    heroFace(12.9, -17);
    await tapAt(TAP.knife, 'タップして とる');
    prop('rackKnife', false); prop('heroKnife', true);
    await freeWalk('back');
    heroFace(14.72, -13.57);

    // 子供A（青い子）が やってくる：カメラは ゆっくり 引いて、話しかけて きたら 寄りに もどす
    look(10.0, -11.4, 1.5, false, 'slow');
    sitActor(kidA, 4.2, -8.7, Math.PI / 2);
    await wait(900);
    await walkPath(kidA, [[11.4, -8.9], [11.6, -13.4]], 2.6);
    lookAt(kidA, heroX(), heroZ());
    look(12.4, -13.0, .9, false, 'slow');
    await KA('あ！お兄さんケーキ切ってくれるの？', 3);
    heroFace(kidA.x, kidA.z);
    await H('？');
    await KA('違うの…？', 4);
    await H('青い子だ…。');

    const first = await choose(['切ってあげる', '嘘をつく']);
    let kind = true;                                   // ①❶❷ … やさしく 切った
    if (first === '切ってあげる') {
      await H('そうだよ。切ろうとしてたところ。');
      nameA = 'リアオ';
      await KA('やったー！おいら、リアオ！おいらの他に6人いるから、お兄さんの分含めて8人分ね！', 2);
      await H('8等分か。やってみよう。');
      heroFace(14.72, -13.57);
      await cutTheCake();
    } else {
      await H('違う。美味しそうだなって見てただけだよ。');
      await KA('でもナイフ…。', 1);
      await KA('あ…、もしかしてお客さん！？', 3);
      nameA = 'リアオ';
      await KA('おいらリアオ！お兄さんの代わりにおいらが切ってあげるよ！', 2);
      // 子供Aが 切って 失敗する（3を えらぶと、時が もどって ここから やりなおす）
      let rewound = false;
      while (true) {
        if (!rewound) await kidTries();
        rewound = false;
        const c = await choose(['切り方を教える', '代わりに切る', '…。']);
        if (c === '切り方を教える') {
          await H('振り被らず、もっとゆっくりやれば綺麗に切れるよ。');
          await KA('おいら、実は初めてナイフを持ったんだ。ちょっとだけ怖いから、一緒に切って欲しい！', 2);
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
          await walkPath(kidA, [[11.4, -8.9], [4.0, -8.7]], 4.0); kidA.visible = false; prop('tears', false);
          prop('heroKnife', true);
          await walkHero(13.2, -13.4, 500); heroFace(14.72, -13.57);
          kind = false;
        }
        await H('さっき、8人分って言っていたか？一応8個に切り分けるか。');
        await cutTheCake();
        if (kind) break;
        // ❸：一人で 食べて、眠って しまう → アラームで 時が もどる
        await alone();                                  // 時が もどって、子供Aが 切りそこねた 所から
        kind = true; rewound = true;
      }
    }

    // ---------- 机に 運ぶ ----------
    await H('できた。机に運ぼう。');
    prop('heroKnife', false); prop('carry', true); cake('carry');
    const riaoComes = kidA.visible ? walkPath(kidA, [[11.4, -8.9], [-1.9, -8.9], [-2.2, -12.9]], 2.4) : null;
    await freeWalk('table');                                  // テーブルの 近くなら どこからでも 置ける
    heroFace(0, -15.5);
    await tapAt(TAP.table, 'タップして おく');
    prop('carry', false); cake('table');

    // ---------- ①❶❷：ダイニングで ----------
    if (riaoComes) await riaoComes;                          // リアオが まだ 来ていなければ 着くまで 待つ
    lookAt(kidA, heroX(), heroZ()); heroFace(kidA.x, kidA.z);
    await KA('お兄さんありがとう！すごく綺麗に切ってある！', 2);
    await H('うん。一緒に食べようか。');
    // 主人公と リアオは 椅子に 座る
    look(0, -14.5);
    await Promise.all([
      walkHeroPath(toChair(), 2.0).then(() => sitHero(1.32, -14.45, 0, -14.45, -.15, 600)),
      walkPath(kidA, [[-2.2, -14.45], [-1.6, -14.45]], 1.6).then(() => { sitActor(kidA, -1.41, -14.45, Math.PI / 2); return sitDown(kidA, .18); }),
    ]);
    // ケーキを 一切れずつ テーブルに 置く（ホールケーキは 6切れ のこる）
    await serveSlice(0);
    await serveSlice(1);
    await wait(400);
    await KA('あ、あのね。おいら、2つ欲しいんだ。', 3);
    await H('2つ？一人で2つ食べるのか？');
    await KA('そ、それは……。', 1);
    await H('君の他に、かいと…じゃなくてオーナーさんとあと5人の子がいるんだろう？みんな食べれるようにちょうど8個に切ったんだ。');
    await H('一人で2つ食べちゃったら、食べれない子が出てくる。それに、他の子も2つ食べたくなっちゃうんじゃないかな？');
    await KA('お、おいらは2個食べないよう！', 4);
    await H('じゃあなんで2個って…。');
    await KA('…オーナーさんとおいらしか知らない秘密なんだけど、屋根裏においらと同じような子がもう一人いるんだ。', 1);
    await KA('その子に…もケーキをあげたい…。', 1);
    await H('っ！');
    await H('そうだったのか…！じゃあ、今から渡しに行って、一緒に食べよう。');
    await KA('うん！ありがとう！', 2);
    // 階段へ（プレイヤーが 歩く。子供Aは 先に 階段へ）
    await Promise.all([sitHero(null, 0, 0, 0, 0, 400), sitDown(kidA, 0, 400)]);
    // 主人公は 自分の 一切れを、リアオは 自分のと シィの 分の 2切れを お盆に のせて 持つ
    pickDish(0); heroHoldDish(true);
    await bendPut(kidA, () => { pickDish(1); cakeTake(); prop('kidPlates', true); prop('traySlices', true); }, 900);
    walkPath(kidA, [[-1.9, -12.0], [0.5, -8.4], [5.6, -8.6], [5.6, -12.4]], 2.4);
    await freeWalk('stairs');
    await fadeOut('black', 700);

    // ---------- ○登った 先の 部屋の 扉の 前 ----------
    place('attic');
    cake('hidden'); prop('kidPlates', true); heroHoldDish(true);
    setHero(10.6, -11.6); heroFace(6.7, -12.9);
    sitActor(kidA, 7.8, -12.9, -Math.PI / 2);
    look(8.6, -11.8);
    await fadeIn(700);
    await KA('シィ〜？おやつ持ってきたよ！', 1);
    await KB('やった！ありがとう。', 2);
    await KA('一緒に食べよう！ケーキを切ってくれたお兄さんも一緒にいるんだけど、入っていいかな？', 1);
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
    await KB('へぇー！すごく綺麗に切れてる！', 3);
    await KA('おいらも切ろうとしたんだけど、またうまく切れなくて…。', 1);
    await KA('お兄さんが助けてくれたんだ！', 2);
    await KB('前まで切ろうともしなかったじゃないか！1歩前進だよ！', 3);
    await KA('へへっ。', 2);
    await H('なんの話をしているんだ？');
    await KA('あっ。おいら、自分の力のコントロールができないんだ。', 1);
    await H('力のコントロール？');
    await KA('例えば、さっきのナイフとか何かを持つときに、正しい力の加減がわからないんだ。', 1);
    await KA('でも、今日は僕の誕生日だから、何か力に変化が起きているかもしれないって思って、挑戦しちゃった。', 2);
    await H('力加減がわからない…。');
    await KA('だから、お兄さんが助けてくれて良かった！', 2);
    await H('ううん。怪我がなくて良かったよ。一緒に食べてお誕生日のお祝いをしよう。');
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
    await KA('この世界？別の世界があるの？', 1);
    await KB('…。', 1);
    await KA('おいらたちもいつか新しい景色を見れたらいいね！', 1);
    await KB('うん…。', 1);
    await H('この世界から出るための鍵を探しているんだ。怪盗さんからはその鍵は「星」だって聞いた。');
    await KA('カイトウ？', 1);
    await H('お、オーナーさん！');
    // リアオが 首元に 隠していた 星の ネックレスを 手に 取って 見せる
    lookAt(kidA, heroX(), heroZ());
    look(-1.0, -6.4, .7, false, 'slow');                                   // ゆっくり 寄る
    await KA('おいら、オーナーさんからもらった星を持ってるよ！お兄さんが探してるのってこれ？', 3);
    await showStar();
    await H('星だ…！');
    await KA('お兄さんになら、おいらこれあげてもいいよ！', 2);
    await H('本当か？');
    await KA('うん！お兄さん、ケーキ切る時も優しくしてくれたし、おいらがケーキ2つ持って行こうとしたら、怒るんじゃなくて話を聞いてくれたし。', 2);
    await KA('今日会ったのが信じられないくらい、お兄さんといると落ち着くんだ！お兄さんのこと大好きだから、あげる！', 2);
    look(.7, -6.6, 1, false, 'slow');                                      // 3人が 見える アングルに もどす
    await H('ありがとう。');
    await wait(700);                                                       // 主人公が 見えてから 渡す
    await giveStar();
    note('星を 1つ 手に いれた！');
    await wait(600);
    hideStar();                                                            // 受け取ったら しまう
    await KA('また会えたらいいね。', 2);
    await KB('でも、お兄さんにはお兄さんの世界があるんでしょ。会えないかもしれない。', 1);
    await KA('そっかぁ。残念だな。', 1);
    await KA('じゃあ、お兄さんのこと一生忘れないようにする！', 2);
    await KB('うん。', 1);
    await H('ありがとう。');
    await KB('次はどこに行くの？', 1);
    const next = await choose(['分からない', '教えて欲しい']);
    if (next === '分からない') await H('分からない…。');
    else await H('次に行く所を、教えて欲しい。');
    await KB('お兄さんは星を集めているんだよね。そしたら、海辺に行くといいよ。', 1);
    await H('海辺？');
    await KB('この部屋のドアから屋上に出て、降りた先の花道を辿れば、海辺に着くよ。', 1);
    await H('そうか。行ってみるよ。');
    await KA('おいらは片付けしておくから、シィが途中まで案内してあげなよ！', 1);
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
    await KA('ほら！持てた！洗い物をしちゃうぞー！へへっ。', 2);
    await KA('シィはここら辺のことたくさん知ってるから、おいらよりもお兄さんも安心できるよ！', 3);
    await KA('あと、お兄さんともう会えないかもしれないなら、今のうちにたくさん話さなくちゃ。おいらはたくさん話したけど、シィはまだ少ししか話してないでしょ？', 3);
    await KB('あぁ…。', 3);
    await KB('じゃあ、途中までだけど、私が案内するよ。', 1);
    await H('ありがとう。');
    heroFace(kidA.x, kidA.z); lookAt(kidA, heroX(), heroZ());
    await KA('お兄さん！じゃあね！おいらのこと、忘れないでね！', 2);
    await H('うん。バイバイ。');
    // 子供Aに 見送られて、部屋の 片隅の ドアから 屋上へ（子供Bが 先に 扉を 開けて 出る。主人公は プレイヤーが 歩く）
    await Promise.all([sitHero(null, 0, 0, 0, 0, 400), sitDown(kidB, 0, 400)]);
    kidA.track = true;                                                     // リアオは その場で 主人公を 目で おって 見送る
    (async () => {
      await walkPath(kidB, [[-2.4, -7.9], [-5.4, -4.6], [-6.0, -1.6]], 1.6);
      await openDoor('exit', 700);
      await walkActor(kidB, -7.7, -1.6, 700); kidB.visible = false;
    })();
    await freeWalk('exit');
    await fadeOut('black', 900);
    end('場面2 おわり\n\n（つぎは 場面3「夜空に近い屋上」）');

    // ---------- 場面2で くりかえし 使う できごと ----------
    // テーブルの どこに いても、テーブルを まわりこんで 主人公の 椅子（右の 手前から 3つ目）へ
    function toChair() {
      const pts = [], x = heroX(), z = heroZ();
      if (z < -12.9) { const side = x < 0 ? -2.3 : 2.3; pts.push([side, z], [side, -12.7]); }
      pts.push([2.2, -12.7], [2.2, -14.45], [1.75, -14.45]);
      return pts;
    }
    // ケーキを 8こに 切る（ミニゲーム）
    async function cutTheCake() {
      prop('badCut', false);
      note('ケーキを 8こに 切ろう');
      await cakeGame();
      cakeSliced();
    }
    // 子供Aが ナイフを 受けとって 切る が、うまく いかない
    async function kidTries() {
      prop('heroKnife', false); prop('kidKnife', true); prop('tears', false);
      cakeReset();
      await walkHero(12.0, -12.2, 500);
      await walkActor(kidA, 13.2, -13.3, 500); lookAt(kidA, 14.72, -13.57);
      heroFace(kidA.x, kidA.z);
      await KA('は、初めてのケーキ切りだ！真ん中を切ればいいんだよね？そ、それっ！', 2);
      await kidChop(700);
      prop('badCut', true);
      await KA('あ、あれ…。', 1);
      lookAt(kidA, heroX(), heroZ());
      prop('tears', true);
      await KA('今のおいらならできると思ったんだけどな…。やっぱり、お兄さんが切った方が良かったんだ。', 4);
    }
    // ❸：だまって いたら、ひとりで 食べて 眠って しまう
    async function alone() {
      await H('できた。机に運ぼう。');
      prop('heroKnife', false); prop('carry', true); cake('carry');
      await freeWalk('table');
      heroFace(0, -15.5);
      await tapAt(TAP.table, 'タップして おく');
      prop('carry', false); cake('table');
      sitActor(kidA, -2.2, -11.6, Math.PI);
      await walkActor(kidA, -1.6, -13.2, 700); lookAt(kidA, 0, -15.5);
      await KA('お、お兄さん！ケーキ切ってくれてありがとう。', 1);
      await H('うん。');
      await KA('おいらも食べていい？', 2);
      await H('うん。');
      look(0, -14.5);
      await walkHeroPath(toChair(), 2.0); await sitHero(1.32, -14.45, 0, -14.45, -.15, 500);
      await eatSlices(1, 600);                                 // 主人公が 1つ 食べる
      await walkActor(kidA, -.9, -14.4, 500); lookAt(kidA, 0, -15.5);
      await tapAt(TAP.kidHand, 'タップ');                      // 2つ 取ろうと する 手を
      await KA('いてっ！', 1);
      await H('人数分で切っているから、1人1個までだよ。');
      await KA('と、友達に渡しに行こうと思って…。', 1);
      await H('そうか。');
      await KA('うん…。じゃあ、持っていくね。', 1);
      await eatSlices(2, 200);
      await walkPath(kidA, [[-2.2, -12.0], [-.3, -8.6], [4.0, -8.7]], 2.6); kidA.visible = false;
      await wait(800);
      while (true) {
        await H('もう一個食べようかな。');
        const c = await choose(['食べる', '食べない']);
        if (c === '食べない') break;
        await eatSlices(1, 700);
        if (cakeLeft() === 0) break;
      }
      await H('なんだか眠くなってきたな…。');
      await sleep(1200);
      await fadeOut('black', 1500);
      await wait(5000);
      show('watch'); show('ring');
      await say('アラーム', 'ピピピッ…。');
      await H('ん…？');
      await tapAt(null, 'タップして とめる');
      hide('ring');
      await say('アラーム', 'ピッ。');
      hide('watch');
      // 光って、子供Aが ケーキを 切りそこねた 所へ もどる
      await fadeOut('white', 300);
      await sleep(0, false);
      sitHero(null); look(null); cake('counter'); cakeReset();
      setHero(12.0, -12.2); sitActor(kidA, 13.2, -13.3, 0); lookAt(kidA, heroX(), heroZ()); heroFace(kidA.x, kidA.z);
      prop('badCut', true); prop('kidKnife', true); prop('tears', true);
      await fadeIn(700);
    }
  },
};
