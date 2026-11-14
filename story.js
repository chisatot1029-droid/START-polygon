// ============================================================
// 低ポリゴン版（ためし）専用の ストーリー
//   シナリオ最新版（スターと＿claude用／スターと＿シナリオ.pdf）の 場面1 まで。
//   2D 版（リポジトリ START の js/story.js）とは べつの ファイルです。
//
// ■ 2D と 同じ 命令に くわえて、低ポリゴン版だけの 命令
//   await stopAlarm()            … 時計に「タップして とめる」が 出て、プレイヤーが 止めるまで 待つ
//   walked()                     … スタート地点から 何px 歩いたか
//   flags.run = true             … 主人公が 走る（STORY.runSpeed）
//   await policeTurn()           … けいさつが 体を 一周まわして かいとう（黄色い人）に 変わる
//   show('gun') / show('flowers')… けいさつの けんじゅう ／ 銃から 出た 花束
//   await runWithKaitou()        … かいとうが 主人公の 手を取って 上へ 走る
//   place('house')               … かいとうの家の前（星空の 下の 家）に うつる
//   moonlight()                  … 月の光が かいとうを てらす
//   await enterHouse()           … かいとうが ドアを 開けて 家に入り、主人公も つづく
//   await arriveHouse()          … かいとうと 主人公が 走って 家の前に 着く
//   breakWall('left' / 'right') / repairWall() … 左（右）の かべを こわす ／ もとに もどす（時が もどった 時）
//   （プレイヤーが 自由に 歩ける 間は、進む 方向に 矢印が 出ます）
//   主人公M（心の声）は （ ） で かこむ
// ============================================================

const STORY = {
  // 場面1 の 地図（田野さんの「スターとマップ」より。100px = 1m、y は 上へ いくほど 小さい）
  //   下から：目を覚ます 部屋 → 仕切り（まんなかに 出入口）→ 植木の ある 長い 通路（バケモノの 場面）
  //          → 階段（3m 上る）→ さくに かこまれた 家の前の 広場 → 家（アーチの ドア）
  map: {
    floorLeft: 255, floorRight: 948,     // 通路の かべの 内がわ
    walkLeft: 300, walkRight: 905,       // 両わきに 植木が あるので 歩けるのは 少し 内がわ
    floorBottom: 5990,                   // 目を覚ます 部屋の 下の かべ
    corridorTop: 1435,                   // ここから 上は 階段
    stairsTop: -80, stairsRise: 3,       // 階段を 上りきった 所（家の前の 広場の 手前の はし）
    plazaTop: -1034, plazaLeft: -1015, plazaRight: 1695,   // 家の前の 広場（さくの 内がわ）
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
    'この場にのこる',                    // つぎは 左の「助けに行く」
    'ヘッドホンのコード',
    '3つとなりのまちで…。', 'まきもどす',      // まきもどすと 家を 答える 選択肢に もどる
    'すぐそこです。', 'にげる',
    '出たいとつたえない',
    'うそをつく', '代わりに切る',        // 場面2：子どもAが 切りそこねて、代わりに 切る
    '分からない',
  ],
  // オートで 書き込む 欄に 入れる ことば（じゅんばんに 使う）
  autoWrites: ['がんばりやさん', '前もって 人数を 教えてくれたから'],

  // ---------- ○ホーム画面の ナレーション（「始める」を 押したあとに 流れる） ----------
  //   ナレーションは 画面を 暗くして 白い 文字で まんなかに 出る。研究員は 研究室の カットで 話す
  home: async () => {
    await say('ナレーション', 'これはとあるロボットが、\n人間を研究するために作ったゲーム「スターと」です。');
    await say('ナレーション', '長いこと起動されるのを待っています。\n遊んであげましょう。');
    await labCut('talk');
    await say('研究員', 'やっと遊んでくれる人があらわれたのか！どんなデータが取れるか、こっそりここから見ていよう！');
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
    await say('ナレーション', 'あなたは、\n主人公とともにこの世界からだっしゅつを目指しましょう。');
    await say('ナレーション', 'よく考え、あなたの思うみらいに進んでください。');
    await say('ナレーション', 'では、スタートです。');
    note('ここは「主人公の一人しょうの動画」が入る予定（数回まばたきをし、起き上がる）');
    await blink();
    await say('主人公', 'ねむっていたのか…？まだ目がさめきらないが、とにかくここを出なくては。', { face: 'heroSleepy' });
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
        await say('???', 'おーい！だれかいるのか？\n助けてくれー！');
        hide('exclaim');
        // 助けに行くか 迷う
        //   ②この場にのこる：人物A「助けてってばー！」と 何度も 聞こえる。
        //   2回 つづけて ② を えらぶと、①助けに行く だけが 出る
        let stay = 0;
        while (true) {
          if (stay === 0) await say('主人公', '…？', { face: 'hero' });
          const c = await choose(stay >= 2 ? ['助けに行く'] : ['助けに行く', 'この場にのこる']);
          if (c === '助けに行く') break;
          stay++;
          show('exclaim');
          await say('???', '助けてってばー' + '！'.repeat(stay));           // のこるたびに「！」が ふえる
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
        await say('主人公', 'なんだ！？時計なんて持っていたか？', { face: 'hero' });
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
        await say('???', '助けてもらったところ申しわけないが、\n急いでるんだ！', { face: 'kaitou5' });
        await say('???', 'またいつか会えたら\nかならずお礼をするよ！', { face: 'kaitou5' });
        await say('???', '本当にありがとう！', { face: 'kaitou5' });
        await captiveWalk(136, -750, 2000);                                  // 清らかな 笑顔で 礼を つたえ、すぐに 去る
        monster('none');
        await say('主人公', 'あぁ…。', { face: 'hero' });
        await say('主人公', '（というか、どうなっているんだ？\n同じことが2回も起きている…。）', { face: 'hero' });

        // ---- けいさつ ----
        await wait(800);                                                    // 奥の方から ドタバタと 物音
        await say('?', '…ここに…だ…がすな！');
        await say('主人公', '？', { face: 'hero' });
        await wait(600);                                                    // すぐに けいさつが あらわれる
        police('police');
        await policeWalk(0, 710, 1800);
        await say('けいさつ', 'おいそこの君！ここらへんで\nじけんが起きたと聞いたが、');
        await say('けいさつ', '何か見なかったか！？');
        await say('主人公', '（早くここを出なくては\nいけないんだ…。）', { face: 'hero' });
        await say('主人公', '（めんどうなことに\nまきこまれたくはない。）', { face: 'hero' });
        await say('主人公', 'じけん…。知らないです。', { face: 'hero' });     // 目を 合わせずに

        // けいさつに 家を 聞かれる 場面（③まきもどす を えらぶと ここに もどる）
        let act, rewound = false;
        while (true) {
          await say('けいさつ', 'そうか。さいきんぶっそうになってきたから\n気をつけろよ。');
          await say('けいさつ', '…君、お家は？');
          if (rewound) {
            await say('主人公', '他の言いわけは…。', { face: 'hero' });   // まき戻した 時
          } else {
            await say('主人公', '（ぼくの家は…。）', { face: 'hero' });
            await say('主人公', '（どうしよう！すぐ答えなかったら\nあやしまれる！）', { face: 'hero' });
            await say('主人公', 'えーと。', { face: 'hero' });
          }
          const answer = await choose(['すぐそこです。', '3つとなりのまちで…。', '…。']);
          await say('主人公', answer, { face: 'hero' });
          if (answer === 'すぐそこです。') await say('けいさつ', 'ここらへんにとうろくされてる\nじゅうたく地はないぞ。');
          else if (answer === '3つとなりのまちで…。') await say('けいさつ', 'ここは他のまちの者は\n立ち入りきんしだぞ。');
          else await say('けいさつ', '答えられないのか？');
          await say('けいさつ', 'どういうことだ？君、\n少しだけ話を聞いてもいいかな？');   // 動揺する 主人公を 怪しむ
          if (!rewound) {                                                   // まき戻した 時は 言わない
            await say('主人公', 'このままだとまずい！', { face: 'hero' });
            // けいさつに 対しての 行動が 出たあと、画面に 透明度50%の 黒い 幕が はられ、研究員の カットが 入る
            // 選択肢が 出た 直後に（押す すきを あたえず）黒い 幕と 研究員。選択肢は 幕の 下に 見えたまま
            await peekChoose(['たたかう', 'にげる', 'まきもどす']);
            await labCut('dim');
            await say('研究員', 'ワタクシはここで、「自分を守るため」か「早くだっしゅつするためか」、何をゆうせんして行動をえらぶのかを研究しているんだった！');
            await say('研究員', 'この行動は、大事なデータとして取らせていただこう。');
            await labCut(false);
            unpeek();
          }
          act = await choose(['たたかう', 'にげる', 'まきもどす']);
          if (act !== 'まきもどす') break;
          // ③：けいさつに 家を 聞かれる 場面に まき戻される
          rewound = true;
          show('watch');
          await wait(300);
          await fadeOut('white', 300);
          hide('watch');
          await fadeIn(400);
        }
        if (act === 'たたかう') {
          await say('主人公', 'いっそたたかうか…！', { face: 'hero' });
          await walkTo(2830, 500);                                          // けいさつに むかって 一歩
        } else {
          await say('主人公', 'にげろっ！', { face: 'hero' });
          await walkTo(3050, 500);                                          // にげようと する
        }
        await labCut('memo');                                                     // 研究員が メモを する 仕草
        await wait(1800);
        await labCut(false);
        show('gun');                                                        // けいさつが けんじゅうを 突きつける
        await say('主人公', 'けんじゅうっ！？', { face: 'hero' });
        await wait(2000);                                                   // 主人公が 2秒 身構える
        await say('けいさつ', 'パンッ！');
        await fadeOut('white', 80);                                         // 発砲する
        await fadeIn(300);
        show('flowers');                                                    // 銃弾では なく 花束が 出る
        await wait(2000);                                                   // 2秒ほど 固まる 主人公
        await say('主人公', '…？', { face: 'hero' });
        await say('けいさつ', 'おいおい。\nなんか言ってくれよ。');
        await say('主人公', 'え？', { face: 'hero' });
        await say('けいさつ', 'さっきは助けてくれてありがとう！');
        await say('主人公', '（さっき？だれだ？）', { face: 'hero' });
        hide('gun');
        hide('flowers');
        await policeTurn();                                                 // 体を 一周 まわすと、人物Aの すがたへ

        // ---- かいとう ----
        await say('主人公', 'さっきの！', { face: 'hero' });
        await say('かいとう', 'やっとわかってくれたか！', { face: 'kaitou2' });
        await say('主人公', '（でも、どういうことだ？\nおそわれていた人が、）', { face: 'hero' });
        await say('主人公', '（けいさつにへんそうして、\n今度はうとうとした…？）', { face: 'hero' });
        await say('かいとう', 'やれやれ。もっとおどろいてくれよ。\n君はこの世界にはじめて来たんだろう？', { face: 'kaitou3' });
        await say('かいとう', '心細いと思って、君を楽しませるために\n色々と用意したんだ！', { face: 'kaitou2' });
        await say('かいとう', '美味しい食事も、いろんな人との出会いも！\nさいごにはとっておきのお楽しみが待っている。', { face: 'kaitou2' });
        await say('かいとう', '君、時計を持っているだろう？', { face: 'kaitou1' });
        show('watch');
        await say('主人公', 'あぁ、これ。\nこんなもの持っていなかったのに。', { face: 'hero' });
        await say('かいとう', 'ふふふ。', { face: 'kaitou2' });
        await say('かいとう', 'このアラームが鳴った時に\n自分で止めると時間をもどせるんだ。', { face: 'kaitou1' });
        await say('かいとう', '本当の人生をやり直すことは\nできないが、この世界ではそれがかなう。', { face: 'kaitou1' });
        await say('かいとう', 'どうだ？面白いだろう！？', { face: 'kaitou2' });
        hide('watch');
        await say('主人公', '時間をもどす…。\nたしかにさっきは時がもどっていた。', { face: 'hero' });
        await say('主人公', 'この人は何か\n知っているのかもしれない。', { face: 'hero' });
        await say('かいとう', 'ぜひこの世界を楽しんでくれ！\nさぁ。行こう！', { face: 'kaitou1' });
        // かいとうは 主人公を 置いて 走り出す。【プレイヤーの 操作】かいとうに ついていく
        await kaitouRunAhead();
        follow();
        flags.follow = true;
        flags.run = true;                                                   // かいとうに ついていく 時も 2周目と 同じ 速さ
      },
    },
    {
      // かいとうを 追って 階段まで 来たら、暗い 通路を 抜けて 家の前へ
      id: 'house',
      y: 1600,
      if: () => flags.follow,
      run: async () => {
        flags.follow = false;
        flags.run = false;                                                  // 家の 前と 中は 今までの 速さ
        await fadeOut('black', 800);

        // ---------- ○かいとうの家の前（暗い通路を抜け、星空の もとに ポツンと 佇む 家） ----------
        police('none');
        place('house');
        const arrive = arriveHouse('follow');                               // 先に 着いた かいとうの もとへ
        await fadeIn(900);
        await arrive;
        await say('かいとう', 'こんなに走ったのはひさびさだ！', { face: 'kaitou2' });
        await say('かいとう', '君を楽しませるはずが\nぼくも楽しんでしまっているよ。', { face: 'kaitou2' });
        await say('かいとう', 'これからの出来事、\nどうか楽しんでくれ！', { face: 'kaitou2' });
        await say('主人公', 'ふふっ。うん。', { face: 'hero' });
        moonlight();                                                        // 月の光が かいとうを 照らし、輝くような 笑顔に
        await wait(1500);                                                   // 一瞬 微笑む 主人公。次第に 顔が 暗くなる
        await say('主人公', '（あ…。でも、\nぼくはこの世界から出たいんだった…。）', { face: 'hero' });
        const feel = await choose(['出たいとつたえる', '出たいとつたえない']);
        if (feel === '出たいとつたえる') {
          await say('主人公', '楽しませようとしているのは\nうれしいが、助けてほしいんだ。', { face: 'hero' });
          await say('かいとう', '助ける…？というか、\n君はむくちな子だと思っていたよ。', { face: 'kaitou1' });
          await say('かいとう', 'ぼくがへんしんした時もむはんのうだし、\n口数も少ないし…。', { face: 'kaitou1' });
          await say('かいとう', 'なぁんだ、すなおにつたえられるじゃないか。\nそうか、人は見た目ではわからないね。', { face: 'kaitou2' });
        } else {
          await say('主人公', 'あぁ。楽しみだよ…。', { face: 'hero' });
          await say('かいとう', '…。', { face: 'kaitou4' });
          await say('かいとう', '本当に楽しみにしているのか…？', { face: 'kaitou4' });
          await say('かいとう', '何か言いたそうに\nしているように見えるが。', { face: 'kaitou4' });
          await say('かいとう', 'ごめんよ、きっとぼくに\n合わせてくれたんだろう？', { face: 'kaitou3' });
          await say('かいとう', 'すてきなやさしさだが、\n自分をころしてはいけないよ。', { face: 'kaitou3' });
          await say('主人公', 'ころす？', { face: 'hero' });
          await say('かいとう', 'もののたとえさ。自分の意見や\nかんじょうをおさえこんでまで、', { face: 'kaitou4' });
          await say('かいとう', '他人をゆうせんすること。\n他人を想うやさしさでもあるが、', { face: 'kaitou4' });
          await say('かいとう', '次第に自分が\nわからなくなるかもしれない。', { face: 'kaitou4' });
          await say('かいとう', 'ぼくの前では\n自分をころさなくていいさ。', { face: 'kaitou3' });
          await say('主人公', 'うん、わかった。\n…ここから出たい。', { face: 'hero' });
          await say('かいとう', 'そうか。出たいのか。', { face: 'kaitou1' });
        }
        // ここで ①と② が 合流
        await say('かいとう', 'そうだなぁ。\nこの世界からぬけ出すには、', { face: 'kaitou1' });
        await say('かいとう', 'とびらを開けるかぎ「星」を\n集めるひつようがある。', { face: 'kaitou1' });
        await say('かいとう', 'その星は、きっとこれから\n出会う人たちが持っているさ。', { face: 'kaitou1' });
        await say('主人公', '星を集める…。', { face: 'hero' });
        await say('かいとう', 'この家の中に、\n星をわたした子が一人いたはず。', { face: 'kaitou1' });
        await say('かいとう', 'まずは話してみるといい。', { face: 'kaitou2' });
        await enterHouse('open');                                           // かいとうが ゆっくり ドアを 開ける
        await say('かいとう', 'さぁ、入って。', { face: 'kaitou1' });
        await enterHouse('in');                                             // かいとうが 先に 入り、主人公も 後を 追う
        await fadeOut('black', 800);
        await STORY.scene2();
      },
    },
  ],

  // ============================================================
  // 場面2：緑が多い暖かな家の中 → 屋根うら
  //   地図（スターとマップ）の 1階と 屋根うら。単位は m（1階の 原点は 玄関の まんなか、奥が -z）
  //   場面2の 命令は 下の 方の コメントを 見てください
  // ============================================================
  scene2: async () => {
    const H = (text, opt) => say('主人公', text, { face: 'hero', ...opt });
    // 子どもA（青い子）は 名前を 名のるまで「子どもA」、名のった あとは「リアオ」。子どもB は「シィ」
    //   KA(セリフ, 顔の番号) … 顔は 子どもAの アイコン 1〜4、KB は 子どもBの アイコン 1〜3
    let nameA = '子どもA';
    const KA = (text, f) => say(nameA, text, { face: f && 'kidA' + f }), KB = (text, f) => say('シィ', text, { face: f && 'kidB' + f });
    const O = (text, face) => say('かいとう', text, { face });
    const R = text => say('研究員', text);                       // 研究員（右下の カットの 吹き出し）
    // 書き込んだ ことばへの 研究員の 相槌：「〇〇なんだね。」
    const aizuchi = t => {
      t = String(t || '').trim().replace(/[。．.！!？?、,～〜…\s]+$/u, '').replace(/(だと|と)?(思う|思います)$/u, '').replace(/(です|だよ|だね|だ|かな)$/u, '');
      if (!t) return '';
      if (t.length > 14) return `「${t}」って思ったんだね。`;
      if (/い$/u.test(t) && !/(きれい|きれい|嫌い|きらい)$/u.test(t)) return t + 'んだね。';
      return t.replace(/な$/u, '') + 'なんだね。';
    };

    // ---------- ○緑が多い暖かな家の中 ----------
    place('home');
    setHero(0, -1.2); heroFace(0, -5);
    sitActor(owner, 1.0, -3.0, 0); lookAt(owner, 0, -1.2);
    await fadeIn(900);
    // 家に入ると 主人公の すがたが 変わる
    await wait(400);
    await fadeOut('white', 250); setOutfit(true); await fadeIn(500);
    await H('あったかい…。');
    await O('外は寒かったからね。星を集めるのも大へんかもしれない。少しゆっくりしていくといい。', 'kaitou1');
    await H('うん。…あれ？こんな服着ていたか？');
    await O('あぁそれ。この家の中では、見た目じゃなく、心でせっせられるように本当のすがたをかくしてすごしているんだ。', 'kaitou1');
    await O('この家にいる子たちはみんな“ワケあり”だからね。', 'kaitou1');
    await O('君も知らない世界にとつぜんやってきた“ワケありさん”だろう？', 'kaitou2');
    await H('ワケありさんか。へぇ。');
    await O('早速で悪いが、ぼくは用事があるからしつれいするね！星は青い子が持っていたはず！', 'kaitou5');
    await O('あとキッチンにあるケーキは切って食べていいよ！子どもたちには、ぼくのこと『オーナー』って言えば通じるから！', 'kaitou5');
    // かいとうは 奥の 裏口から 去る（主人公が 歩けるように なるまで カメラは そのまま）
    await walkPath(owner, [[0, -6.7], [-2.1, -9.5], [-2.1, -18.8], [0, -19.6]], 4.2);
    await openDoor('back', 300);
    await walkActor(owner, 0, -20.6, 300); owner.visible = false;
    await H('いそがしい人だな…。');
    await H('でも、たしかにワケありかも。他に行くあてもなかったし、帰るほうほうすら知らなかったし。');
    await H('これからがんばってだっしゅつするんだ。');

    // ---------- ケーキの 前へ（プレイヤーが 歩く） ----------
    await freeWalk('cake');
    heroFace(14.72, -13.57);
    await H('ケーキってこれか。');
    await say('主人公のおなか', 'ぐるるるるぅぅぅ。');
    await H('おなかすいたな…。食べてから星をさがそう。まずはナイフで切らなくちゃ。');
    // キッチンの はしの ナイフを とって、ケーキの 前に もどる
    await freeWalk('knife');
    heroFace(12.9, -17);
    await tapAt(TAP.knife, 'タップして とる');
    prop('rackKnife', false); prop('heroKnife', true);
    await freeWalk('back');
    heroFace(14.72, -13.57);

    // 子どもA（青い子）が やってくる：カメラは ゆっくり 引いて、話しかけて きたら 寄りに もどす
    look(10.0, -11.4, 1.5, false, 'slow');
    sitActor(kidA, 4.2, -8.7, Math.PI / 2);
    await wait(900);
    await walkPath(kidA, [[11.4, -8.9], [11.6, -13.4]], 2.6);
    lookAt(kidA, heroX(), heroZ());
    look(12.4, -13.0, .9, false, 'slow');
    await KA('あ！お兄さんケーキ切ってくれるの？', 3);
    heroFace(kidA.x, kidA.z);
    await H('？');
    await KA('ちがうの…？', 4);
    await H('青い子だ…。');

    const first = await choose(['切ってあげる', 'うそをつく']);
    let three = false;                                 // ❸「…。」を えらんだ
    if (first === '切ってあげる') {
      await H('そうだよ。切ろうとしてたところ。');
      nameA = 'リアオ';
      await KA('やった！おいら、リアオ！おいらの他に6人いるから、お兄さんの分ふくめて8人分ね！', 2);
      await H('8等分か。');
      heroFace(14.72, -13.57);
      await H('（でも、おなかが空いているからたくさん食べたい気持ちもある…。どうしよう？）');
      await cutByChoice();
    } else {
      await H('ちがう。美味しそうだなって見てただけだよ。');
      await KA('でもナイフ…。', 1);
      await KA('あ…、もしかしてお客さん！？', 3);
      nameA = 'リアオ';
      await KA('おいらリアオ！お兄さんの代わりにおいらが切ってあげるよ！', 2);
      await kidTries();                                // リアオが 切って 失敗する
      const c = await choose(['切り方を教える', '代わりに切る', '…。']);
      if (c === '切り方を教える') {
        await H('ふりかぶらず、もっとゆっくりやればきれいに切れるよ。');
        await KA('おいら、実ははじめてナイフを持ったんだ。ちょっとだけこわいから、いっしょに切ってほしい！', 2);
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
        three = true;
      }
      await H('さっき、8人分って言っていたか？でも、おなかが空いているからたくさん食べたい気持ちもある…。どうしよう？');
      await cutByChoice();
    }
    if (three) { await threeTable(); return; }       // ❸ は ひとりで テーブルへ（このあと 製作中の 所で おわる）

    // ---------- つくえに 運ぶ ----------
    await H('できた。つくえに運ぼう。');
    prop('heroKnife', false); prop('carry', true); cake('carry');
    const riaoComes = kidA.visible ? walkPath(kidA, [[11.4, -8.9], [-1.9, -8.9], [-2.2, -12.9]], 2.4) : null;
    await freeWalk('table');                                  // テーブルの 近くなら どこからでも 置ける
    heroFace(0, -15.5);
    await tapAt(TAP.table, 'タップして おく');
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
    // ケーキを 一切れずつ テーブルに 置く（ホールケーキは 6切れ のこる）
    await serveSlice(0);
    await serveSlice(1);
    await wait(400);
    await KA('あ、あのね。おいら、2つほしいんだ。', 3);
    await H('2つ？一人で2つ食べるのか？');
    await KA('そ、それは…。', 1);
    // 研究員が プレイヤーに 聞く（書き込む 欄）
    await labCut('talk');
    await R('君は、この子どものことをどう思うかな？かんたんな言葉で教えてほしい。');
    const feel = await writeIn({ label: 'この子どものことを どう思う？（かんたんな ことばで）', placeholder: 'れい：くいしんぼう' });
    await R('ふむふむ。なるほど。それはなんでそう思ったんだい？');
    await writeIn({ label: 'なんで そう 思った？', placeholder: 'れい：2つも ほしがったから' });
    await R(`そうだねぇ。${aizuchi(feel)}`);
    await R('ただ、この子どもは前もって君に人数を教えたのに、2つもらおうとしている。それに君だっておなかが空いているのにね。');
    await labCut(false);
    await H('君の他に、かいと…じゃなくてオーナーさんとあと5人の子がいるんだろう？みんな食べれるようにちょうど8こに切ったんだ。');
    await H('一人で2つ食べちゃったら、食べれない子が出てくる。');
    await KA('お、おいらは2こ食べないよう！', 4);
    await labCut('talk');
    await R('おや、1人では食べないようだね。');
    await labCut(false);
    await H('じゃあなんで2こって…。');
    await KA('…オーナーさんとおいらしか知らないひみつなんだけど、屋根うらにおいらと同じような子がもう一人いるんだ。', 1);
    await KA('その子に…もケーキをあげたい…。', 1);
    await labCut('talk');
    await R('この子どもはうそをついていたのか。君をふくめて9人いるということ…。どうするんだい？');
    const give = await choose(['2こあげる', '自分ですきな数を食べる']);
    await labCut(false);
    if (give !== '2こあげる') { await selfish(); return; }   // このあと 製作中の 所で おわる
    await H('そうだったのか…！じゃあ、今からわたしに行って、いっしょに食べよう。');
    await KA('うん！ありがとう！', 2);
    // 階段へ（プレイヤーが 歩く。子どもAは 先に 階段へ）
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
    await KA('シィ～？おやつ持ってきたよ！', 1);
    await KB('やった！ありがとう。', 2);
    await KA('いっしょに食べよう！ケーキを切ってくれたお兄さんもいっしょにいるんだけど、入っていいかな？', 1);
    await KB('いいよー！', 2);
    await openDoor('attic', 900);

    // ---------- ○屋根うら部屋 ----------
    sitActor(kidB, .68, -9.3, 0);
    look(1.4, -8.2);
    await Promise.all([walkPath(kidA, [[5.4, -12.9], [-.6, -8.6]], 2.4), (async () => { await wait(500); await walkHeroPath([[7.6, -12.9], [5.4, -12.9], [2.6, -8.9]], 2.4); })()]);
    lookAt(kidB, heroX(), heroZ()); heroFace(kidB.x, kidB.z); lookAt(kidA, kidB.x, kidB.z);
    await KB('こんにちは。', 1);
    await H('こんにちは。');
    // 子どもAが おやつを ローテーブルに 置く
    await walkActor(kidA, -.4, -7.7, 600); lookAt(kidA, .68, -6.25);
    await bendPut(kidA, () => { prop('kidPlates', false); atticPlates(2); });   // リアオと シィの 分
    lookAt(kidA, kidB.x, kidB.z); lookAt(kidB, kidA.x, kidA.z);                // シィは リアオの ほうを むいて 話す
    await KA('これ、お兄さんが切ってくれたの。', 2);
    await KB('へぇー！すごくきれいに切れてる！', 3);
    await KA('おいらも切ろうとしたんだけど、またうまく切れなくて…。', 1);
    await KA('お兄さんが助けてくれたんだ！', 2);
    await KB('前まで切ろうともしなかったじゃないか！1歩前進だよ！', 3);
    await KA('へへっ。', 2);
    await H('なんの話をしているんだ？');
    await KA('あっ。おいら、自分の力のコントロールができないんだ。', 1);
    await H('力のコントロール？');
    await KA('たとえば、さっきのナイフとか何かを持つときに、正しい力のかげんがわからないんだ。', 1);
    await KA('でも、今日はぼくのたんじょう日だから、何か力にへんかが起きているかもしれないって思って、ちょうせんしちゃった。', 2);
    await H('力かげんがわからない…。');
    await KA('だから、お兄さんが助けてくれてよかった！', 2);
    await H('ううん。けががなくてよかったよ。いっしょに食べておたんじょう日のおいわいをしよう。');
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
    await KA('この世界？べつの世界があるの？', 1);
    await KB('…。', 1);
    await KA('おいらたちもいつか新しいけしきを見れたらいいね！', 1);
    await KB('うん…。', 1);
    await H('この世界から出るためのかぎをさがしているんだ。かいとうさんからはそのかぎは「星」だって聞いた。');
    await KA('カイトウ？', 1);
    await H('お、オーナーさん！');
    // リアオが 首元に かくしていた 星の ネックレスを 手に 取って 見せる
    lookAt(kidA, heroX(), heroZ());
    look(-1.0, -6.4, .7, false, 'slow');                                   // ゆっくり 寄る
    await KA('おいら、オーナーさんからもらった星を持ってるよ！お兄さんがさがしてるのってこれ？', 3);
    await showStar();
    await H('星だ…！');
    await KA('お兄さんになら、おいらこれあげてもいいよ！', 2);
    await H('本当か？');
    await KA('うん！お兄さん、ケーキ切る時もやさしくしてくれたし、おいらがケーキ2つ持って行こうとしたら、おこるんじゃなくて話を聞いてくれたし。', 2);
    await KA('今日会ったのがしんじられないくらい、お兄さんといると落ち着くんだ！お兄さんのこと大すきだから、あげる！', 2);
    look(.7, -6.6, 1, false, 'slow');                                      // 3人が 見える アングルに もどす
    await H('ありがとう。');
    await wait(700);                                                       // 主人公が 見えてから 渡す
    await giveStar();
    note('星を 1つ 手に いれた！');
    await wait(600);
    hideStar();                                                            // 受け取ったら しまう
    await KA('また会えたらいいね。', 2);
    await KB('でも、お兄さんにはお兄さんの世界があるんでしょ。会えないかもしれない。', 1);
    await KA('そっかぁ。ざんねんだな。', 1);
    await KA('じゃあ、お兄さんのこと一生わすれないようにする！', 2);
    await KB('うん。', 1);
    await H('ありがとう。');
    await KB('次はどこに行くの？', 1);
    const next = await choose(['分からない', '教えてほしい']);
    if (next === '分からない') await H('分からない…。');
    else await H('次に行く所を、教えてほしい。');
    await KB('お兄さんは星を集めているんだよね。そしたら、海べに行くといいよ。', 1);
    await H('海べ？');
    await KB('この部屋のドアから屋上に出て、おりた先の花道をたどれば、海べに着くよ。', 1);
    await H('そうか。行ってみるよ。');
    await KA('おいらはかたづけしておくから、シィがとちゅうまであんないしてあげなよ！', 1);
    await KA('今日のおいらはなんだかできる気がする！', 2);
    await KB('え？', 3);
    // 子どもAが 立ち上がって、3枚の お皿を ゆっくり 集める
    await sitDown(kidA, 0, 500);
    //   テーブルを まわりこんで、手前から 1枚ずつ（つくえを 通りぬけない）
    await walkPath(kidA, [[-2.0, -4.75], [-.42, -4.75]], 1.2); lookAt(kidA, -.42, -6.25);
    await bendPut(kidA, () => { takePlate(0); prop('kidPlates', true); prop('traySlices', false); }, 1100);
    await walkActor(kidA, .68, -4.75, 700); lookAt(kidA, .68, -6.75);
    await bendPut(kidA, () => takePlate(1), 1100);
    await walkActor(kidA, 1.78, -4.75, 700); lookAt(kidA, 1.78, -6.25);
    await bendPut(kidA, () => takePlate(2), 1100);
    lookAt(kidA, heroX(), heroZ());
    await wait(500);
    await KA('ほら！持てた！あらい物をしちゃうぞー！へへっ。', 2);
    await KA('シィはここらへんのことたくさん知ってるから、おいらよりもお兄さんも安心できるよ！', 3);
    await KA('あと、お兄さんともう会えないかもしれないなら、今のうちにたくさん話さなくちゃ。おいらはたくさん話したけど、シィはまだ少ししか話してないでしょ？', 3);
    await KB('あぁ…。', 3);
    await KB('じゃあ、とちゅうまでだけど、わたしがあんないするよ。', 1);
    await H('ありがとう。');
    heroFace(kidA.x, kidA.z); lookAt(kidA, heroX(), heroZ());
    await KA('お兄さん！じゃあね！おいらのこと、わすれないでね！', 2);
    await H('うん。バイバイ。');
    // 子どもAに 見送られて、部屋の 片隅の ドアから 屋上へ（子どもBが 先に 扉を 開けて 出る。主人公は プレイヤーが 歩く）
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
    // 何こに 切るか えらんで、その 数の ケーキを 切る ミニゲーム（❶8こ切る ❷すきな数を切る）
    async function cutByChoice() {
      const c = await choose(['8こ切る', 'すきな数を切る']);
      let n = 8;
      if (c === 'すきな数を切る') n = await writeIn({ number: true, min: 2, max: 16, label: '何こに 切る？（2～16）', placeholder: 'れい：10', autoNumber: 6 });
      prop('badCut', false);
      await cakeGame(n);
      cakeSliced(n);
    }
    // 子どもAが ナイフを 受けとって 切る が、うまく いかない
    async function kidTries() {
      prop('heroKnife', false); prop('kidKnife', true); prop('tears', false);
      cakeReset();
      await walkHero(12.0, -12.2, 500);
      await walkActor(kidA, 13.2, -13.3, 500); lookAt(kidA, 14.72, -13.57);
      heroFace(kidA.x, kidA.z);
      await KA('は、はじめてのケーキ切りだ！真ん中を切ればいいんだよね？そ、それっ！', 2);
      await kidChop(700);
      prop('badCut', true);
      await KA('あ、あれ…。', 1);
      lookAt(kidA, heroX(), heroZ());
      prop('tears', true);
      await KA('今のおいらならできると思ったんだけどな…。やっぱり、お兄さんが切った方がよかったんだ。', 4);
    }
    // リアオが ケーキを 持って ゆっくり 2階へ 向かう（とちゅうで 止められたら 止まる）
    function riaoLeaves() {
      const st = { stopped: false };
      st.done = (async () => {
        if (kidA.lift) await sitDown(kidA, 0, 400);
        await walkPath(kidA, [[-2.2, kidA.z], [-2.2, -12.0], [0.5, -8.4], [5.6, -8.6], [5.6, -12.4]], .9);
        if (!st.stopped) kidA.visible = false;
      })();
      return st;
    }
    // リアオが 去ったあと：（研究員の ひとりごと と タップ）→ 2階の 物音 → 家の 中を 自由に 歩く
    async function afterRiaoLeaves(st, remark) {
      if (remark) {
        await labCut('talk');
        await R('子どもはあやまらないんだね。うそをついたことをじかくしていないのかな？おっとごめん！ひとり言が入ってしまった。');
        await labCut(false);
        // 去っていく 子どもを タップするか どうかは プレイヤー しだい（いなくなったら もう タップできない）
        const tapped = st.stopped ? false : await tapUntil(TAP.kidBody, 'タップ', st.done);
        if (tapped) {
          st.stopped = true; sitActor(kidA, kidA.x, kidA.z, 0); lookAt(kidA, heroX(), heroZ());
          await KA('な、なんだい？', 3);
          await H('うそをついたんだ。何か言うことはないか？');
          await KA('うそなんて大げさな！人数なんてたいしたことないだろ！まちがえただけだ！', 1);
          await labCut('talk');
          await R('キレてしまったか…。');
          await labCut(false);
          const how = await choose(['やさしく', '同じたいどで']);
          if (how === 'やさしく') await H('落ち着いて。小さなことでも、うそはダメだよ。それだけわかってくれればいいんだ。');
          else await H('意図てきなまちがいはうそになる！ごまかそうとすればするほど、だれもアンタのことしんようしなくなるぞ！');
          await KA('なんでうそはダメなの？', 1);
          await labCut('talk');
          await R('お、リアオからしつもんが来るとは。');
          await labCut(false);
          const ans = await writeIn({ label: 'リアオに こたえる（なんで うそは ダメ？）', placeholder: 'れい：しんじて もらえなく なるから' });
          await H(ans);
          await KA('フゥン…。ご、ごめんなさい。', 4);
          const again = riaoLeaves(); await again.done;
        } else {
          await labCut('talk');
          await R('しずかになったね。');
          await labCut(false);
        }
      } else await st.done;
      await say('', 'ドタバタ……。');
      await H('今の音はなんだ？2階からしたような…。');
      await roamHouse();
    }
    // 家の 中を 自由に 歩く。玄関ドアの 前と 2階の 階段前で「この先に行きますか？」
    async function roamHouse() {
      const where = await roam([{ name: 'door', x: 0, z: -.9, r: 1.0 }, { name: 'stairs', x: 6.3, z: -11.4, r: 1.1 }], 'stairsAny');
      if (where === 'door') {
        await fadeOut('black', 600);
        // ○家の前の庭
        setOutfit(false); gardenSetup();
        await fadeIn(600);
        await say('', 'ガチャ。');
        await O('おや？帰るのかい？', 'kaitou1');
        await H('！');
        await O('星はいいのかい？まぁ、この家でなくても星を持っている子はいるからね。', 'kaitou1');
        await H('……。');
        await O('どうする？', 'kaitou1');
        const c = await choose(['先に進む', '家にもどる']);
        if (c === '先に進む') {
          await O('そうか。じゃあ左手にあるさくから次の花道につづいている。行ってらっしゃい。', 'kaitou2');
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
      // ○屋根うらの廊下（製作中）
      await fadeOut('black', 700);
      end('場面2\n\n○屋根うらのろうか\n（ここから先は せいさく中）');
    }
    // ②自分ですきな数を食べる を えらんだ 時
    async function selfish() {
      await labCut('talk');
      await R('この子どもにおなかがへっていることをつたえるかい？');
      const t = await choose(['つたえる', 'つたえない']);
      await labCut(false);
      let st;
      if (t === 'つたえる') {
        const w = await writeIn({ label: 'リアオに つたえる', placeholder: 'れい：ぼくも おなかが ペコペコなんだ' });
        await H(w);
        await KA('わかった…。', 4);
        pickDish(1); prop('kidPlates', true); prop('trayOne', true);         // 1つの ケーキを 持って 2階へ
        st = riaoLeaves();
        await H('これですきな数食べることができる。');
      } else {
        await H('だめだよ。元々言われた数で切っているんだから。');
        await KA('…。わかった。', 4);
        pickDish(1); prop('kidPlates', true); prop('trayOne', true);
        st = riaoLeaves();
      }
      await afterRiaoLeaves(st, true);
    }
    // ❸ を えらんだ 時：ひとりで テーブルへ。あとから リアオが 来る
    async function threeTable() {
      await H('できた。つくえに運ぼう。');
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
      // 主人公は 椅子に 座り、ケーキを 食べ始める。リアオは しずかに ケーキを 2つ 手に 取る
      look(0, -14.5);
      await walkHeroPath(toChair(), 2.0); await sitHero(1.32, -14.45, 0, -14.45, -.15, 500);
      await eatSlices(1, 600);
      await walkActor(kidA, -.9, -14.4, 500); lookAt(kidA, 0, -15.5);
      await labCut('talk');
      await R('この子ども！2こ取ろうとしているよ！どうする…？');
      const c = await choose(['注意する', 'むしする']);
      await labCut(false);
      if (c === '注意する') {
        await tapAt(TAP.kidHand, 'タップ');                                 // 2つ目を 取ろうと する 手を
        await KA('いてっ！', 1);
        await H('人数分で切っているから、1人1こまでだよ。');
        await KA('と、友だちにわたしに行こうと思って…。', 1);
        await H('そうか。');
        await KA('うん…。じゃあ、持っていくね。', 1);
      }
      // リアオは ゆっくり ケーキを 持って、その場から ゆっくり 去る。主人公は 黙々と ケーキを 食べる
      await eatSlices(2, 200); prop('kidPlates', true); prop('traySlices', true);
      const st = riaoLeaves();
      eatSlices(1, 1500);
      await afterRiaoLeaves(st, c === 'むしする');
    }
  },
};
