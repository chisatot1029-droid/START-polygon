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
    '行く',
    '出たいと伝えない',
    '嘘をつく', '代わりに切る',        // 場面2：子供Aが 切りそこねて、代わりに 切る
    '分からない',
  ],

  // ---------- ○何もない部屋 ----------
  opening: async () => {
    flags.loop = 1;
    await fadeOut('black', 0);
    await wait(600);
    await say('主人公', 'また眠ってしまったのか…？', { box: 'bottom' });
    note('ここは「主人公の一人称の動画」が入る予定（瞬きをし、起き上がる）');
    await blink();
    await say('主人公', 'まだ目が覚めきらないが、\nとにかくここを出なくては。', { face: 'heroSleepy' });
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
        await say('???', 'おい！誰かいるのか？\n助けてくれー！');
        hide('exclaim');
        // 助けに行くか 迷う
        //   ②この場に残る：人物A「助けてってばー！」と 何度も 聞こえる。
        //   2回 つづけて ② を えらぶと、①助けに行く だけが 出る
        let stay = 0;
        while (true) {
          await say('主人公', '…。', { face: 'hero' });
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
      id: 'watch',
      y: 5680,
      if: () => flags.loop === 1 && flags.heard,
      run: async () => {
        show('watch');
        show('ring');
        await say('時計', 'ピピピピピピッ…。');
        await say('主人公', 'なんだ？\n時計なんて持っていたか？', { face: 'hero' });
        await walkTo(5560, 1400);                                           // ゆっくり 歩き出すと
        hide('ring');                                                       // アラームが 鳴り、止まる
        await say('時計', 'ピッ…。');
        await say('主人公', '勝手に止まった。\n一体何だったんだ。', { face: 'hero' });
        hide('watch');
      },
    },
    {
      // ---------- ○広い部屋 ----------
      id: 'encounter1',
      y: 3010,                       // バケモノ（y 2555）の 少し 手前
      if: () => flags.loop === 1,
      run: async () => {
        await camera(2070, 900);
        await say('???', 'やっと助けが来たのか！', { face: 'captive' });     // 笑顔で 言う
        await say('主人公', '（な、なんだこのバケモノは…！）', { face: 'hero' });
        await say('???', 'うっ。', { face: 'captive' });
        await wait(800);                                                    // 立ち尽くす
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
        await say('主人公', 'こんな時にまた？', { face: 'hero' });
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
        await say('主人公', '急いでみよう。', { face: 'hero' });
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
        await say('???', 'こいつをやっつけてくれ！', { face: 'captive' });
        await say('主人公', 'やっつける！？\nど、どうすればいいんだ？', { face: 'hero' });
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
        await say('???', '少年！ありがとう！', { face: 'captive' });
        await say('???', '助けてもらったところ申し訳ないが、\n急いでるんだ！', { face: 'captive' });
        await say('???', 'またいつか会えたら\n必ずお礼をするよ！', { face: 'captive' });
        await say('???', 'ほんとありがとうー！', { face: 'captive' });
        await captiveWalk(136, -750, 2000);                                  // 清らかな 笑顔で 礼を 伝え、すぐに 去る
        monster('none');
        await say('主人公', 'あぁ…。', { face: 'hero' });
        await say('主人公', '（というか、どうなっているんだ？\n同じことが2回も起きている…。）', { face: 'hero' });

        // ---- 警察 ----
        await wait(800);                                                    // 奥の方から ドタバタと 物音
        await say('?', '…ここに…だ…がすな！');
        await say('主人公', '？', { face: 'hero' });
        await wait(3000);                                                   // 3秒後に 警察が 現れる
        police('police');
        await policeWalk(0, 710, 1800);
        await say('警察', 'おいそこの君！ここらへんで\n事件が起きたと聞いたが、');
        await say('警察', '何か見なかったか！？');
        await say('主人公', '（ここを出なくては\nいけないんだ…。）', { face: 'hero' });
        await say('主人公', '（今面倒なことに\n巻き込まれたくはない。）', { face: 'hero' });
        await say('主人公', '事件…。知らないです。', { face: 'hero' });     // 目を 合わせずに

        // 警察に 家を 聞かれる 場面（③巻き戻す を えらぶと ここに もどる）
        let act;
        while (true) {
          await say('警察', 'そうか。最近物騒になってきたから\n気をつけろよ。');
          await say('警察', '…君、お家は？');
          await say('主人公', '（僕の家は…。）', { face: 'hero' });
          await say('主人公', '（まずい、すぐ答えなかったら\n不審がられる。）', { face: 'hero' });
          await say('主人公', 'えーと。', { face: 'hero' });
          const answer = await choose(['すぐそこです。', '3つ隣の街で…。', '…。']);
          await say('主人公', answer, { face: 'hero' });
          if (answer === 'すぐそこです。') await say('警察', 'ここら辺に登録されてる\n住宅地はないぞ。');
          else if (answer === '3つ隣の街で…。') await say('警察', 'ここは他の街の者は\n立ち入り禁止だぞ。');
          else await say('警察', '答えられないのか？');
          await say('警察', 'どういうことだ？君、\n少しだけ話を聞いても良いかな？');   // 動揺する 主人公を 怪しむ
          await say('主人公', 'このままだとまずい！', { face: 'hero' });
          act = await choose(['戦う', '逃げる', '巻き戻す']);
          if (act !== '巻き戻す') break;
          // ③：警察に 家を 聞かれる 場面に 巻き戻される
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
        show('gun');                                                        // 警察が 拳銃を 突きつける
        await wait(1000);                                                   // 主人公が 身構える
        await say('警察', 'パンッ！');
        await fadeOut('white', 80);                                         // 躊躇なく 発砲する
        await fadeIn(300);
        show('flowers');                                                    // 銃弾では なく 花束が 出る
        await say('主人公', 'っ！', { face: 'hero' });
        await wait(3000);                                                   // 3秒ほど 固まる 主人公
        await say('主人公', '…？', { face: 'hero' });
        await say('警察', 'おいおい、\nなんか言ってくれよ。');
        await say('主人公', 'え？', { face: 'hero' });
        await say('警察', 'さっきは助けてくれてありがとうな！');
        await say('主人公', '（さっき？誰だ…？）', { face: 'hero' });
        hide('gun');
        hide('flowers');
        await policeTurn();                                                 // 体を 一周 まわすと、人物Aの 姿へ

        // ---- 怪盗 ----
        await say('主人公', 'さっきの！', { face: 'hero' });
        await say('怪盗', 'やっとわかってくれたか！');
        await say('主人公', '（…。でもどういうことだ？\n襲われていたところを助けた人が、）', { face: 'hero' });
        await say('主人公', '（警察に変装して\n今度は撃とうとした…？）', { face: 'hero' });
        await say('主人公', '…。', { face: 'hero' });
        await say('怪盗', 'やれやれ。君は頭の回転が早いねぇ。');
        await say('怪盗', '君はこの世界に初めて来たんだろう？\n心細いと思って、');
        await say('怪盗', '君を楽しませるために\n色々と用意したんだ！');
        await say('怪盗', '美味しい食事も用意しているし、\nいろんな人とも出会えるだろう。');
        await say('怪盗', '最後にはとっておきの\nお楽しみが待っている。');
        await say('怪盗', '君、時計を持っているだろう？');
        show('watch');
        await say('主人公', 'あぁ、これ。\nこんなもの持っていなかったのに。', { face: 'hero' });
        await say('怪盗', 'ふふふ。このアラームが鳴った時に\n自分で止めると、時を戻せるんだ。');
        await say('怪盗', '本当の人生をやり直すことは\nできないが、この世界では叶えられる。');
        await say('怪盗', 'どうだ？面白いだろう！？');
        hide('watch');
        await say('主人公', '時を戻す…。\nさっきは確かに時が戻っていた。', { face: 'hero' });
        await say('主人公', 'この人は何か\n知っているのかもしれない。', { face: 'hero' });
        await say('怪盗', 'さぁ。行こう！');
        await choose(['行く']);                                             // 行く 選択肢しか 表示されない
        const run = runWithKaitou();                                        // 笑顔で 主人公の 手を取り 走り出す
        await wait(1500);
        await fadeOut('black', 800);                                        // 走りながら 暗い 通路へ
        await run;

        // ---------- ○怪盗の家の前（暗い通路を抜け、星空の もとに ポツンと 佇む 家） ----------
        police('none');
        place('house');
        const arrive = arriveHouse();                                       // 走って 家の前に たどり着く
        await fadeIn(900);
        await arrive;
        await say('怪盗', 'こんなに走ったのは久々だ！');
        await say('怪盗', '君を楽しませるはずが\n僕も楽しんでしまっているよ。');
        await say('怪盗', 'これからの出来事、\nどうか楽しんでくれ！');
        await say('主人公', 'ふふっ。うん。', { face: 'hero' });
        moonlight();                                                        // 月の光が 怪盗を 照らし、輝くような 笑顔に
        await wait(1500);                                                   // 一瞬 微笑む 主人公。次第に 顔が 暗くなる
        await say('主人公', '（あ…。でも、\n僕はこの世界から出たいんだよ…。）', { face: 'hero' });
        const feel = await choose(['出たいと伝える', '出たいと伝えない']);
        if (feel === '出たいと伝える') {
          await say('主人公', '楽しませようとしているのは\n嬉しいが、助けて欲しいんだ。', { face: 'hero' });
          await say('怪盗', '助ける…？というか、さっきから\n君は無口な子だと思っていたが、');
          await say('怪盗', '素直に伝えられるじゃないか。');
          await say('怪盗', 'そうか、\n人は見た目ではわからないね。');
        } else {
          await say('主人公', 'あぁ。楽しみだよ…。', { face: 'hero' });
          await say('怪盗', '…。');
          await say('怪盗', '本当に楽しみにしているのか…？');
          await say('怪盗', '何か言いたそうに\nしているように見えるが。');
          await say('怪盗', 'ごめんよ、きっと僕に\n合わせてくれたんだろう？');
          await say('怪盗', '素敵な優しさだが、\n自分を殺してはいけないよ。');
          await say('主人公', '殺す？', { face: 'hero' });
          await say('怪盗', 'ものの例えさ。自分の意見や\n感情を押さえ込んでまで、');
          await say('怪盗', '他人を優先すること。\n他人を想う優しさでもあるが、');
          await say('怪盗', '次第に自分が\nわからなくなるかもしれない。');
          await say('怪盗', '僕の前では\n自分を殺さなくていいさ。');
          await say('主人公', 'うん、わかった。\n…ここから出たい。', { face: 'hero' });
          await say('怪盗', 'そうか。出たいのか。');
        }
        // ここで ①と② が 合流
        await say('怪盗', 'そうだなぁ。\nこの世界から抜け出すには、');
        await say('怪盗', '扉を開ける鍵「星」を\n集める必要がある。');
        await say('怪盗', 'その星は、きっとこれから\n出会う人たちが持っているはず。');
        await say('主人公', '星を集める…。', { face: 'hero' });
        await say('怪盗', 'この家の中に、\n星を持っている子が一人いたはず。');
        await say('怪盗', 'まずは話してみるといい。');
        await enterHouse('open');                                           // 怪盗が ゆっくり ドアを 開ける
        await say('怪盗', 'さぁ入って。');
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
    const KA = text => say('子供A', text), KB = text => say('子供B', text), O = text => say('怪盗', text);

    // ---------- ○緑が多い暖かな家の中 ----------
    place('home');
    setHero(0, -1.2); heroFace(0, -5);
    sitActor(owner, 1.0, -3.0, 0); lookAt(owner, 0, -1.2);
    await fadeIn(900);
    // 家に入ると 主人公の 姿が 変わる
    await wait(400);
    await fadeOut('white', 250); setOutfit(true); await fadeIn(500);
    await H('あったかい…。');
    await O('外は寒かったからね。星を集めるのも大変かもしれない。少しゆっくりしていくといい。');
    await H('うん。…あれ？こんな服着ていたか？');
    await O('あぁそれ。この家の中では、本当の姿を隠して過ごしているんだ。');
    await O('この家にいる子たちはみんなワケありだからね。見た目じゃなく、心で接せられるように。');
    await O('君も知らない世界に突然やってきたワケありさんだろう？');
    await H('ワケありさんか。へぇ。');
    await O('っと。早速で悪いが、僕はやることがあるから失礼するね！');
    await O('あぁ、あとそこのケーキは切って食べていいから！星は青い子が持っていたはず！');
    await O('子供達は僕のことをオーナーさんって呼んでるから、オーナーって言えばわかると思うよ！じゃ！');
    // 怪盗は 奥の 裏口から 去る
    look(0, -8);
    await walkPath(owner, [[0, -6.7], [-2.1, -9.5], [-2.1, -18.8], [0, -19.6]], 4.2);
    await openDoor('back', 300);
    await walkActor(owner, 0, -20.6, 300); owner.visible = false;
    look(null);
    await H('忙しい人だな…。');
    await H('でも、確かにワケありかも。他に行くあてもなかったし、帰る方法すら知らなかったし。');
    await H('これから頑張って脱出するんだ。');

    // ---------- ケーキの 前へ（プレイヤーが 歩く） ----------
    await freeWalk('cake');
    heroFace(14.72, -13.57);
    await H('ケーキってこれか。');
    await say('お腹', 'ぐるるるるぅぅぅ。');
    await H('…。食べてから星を探そうかな。ナイフで切ろうか。');
    // キッチンの はしの ナイフを とって、ケーキの 前に もどる
    await freeWalk('knife');
    heroFace(12.9, -17);
    await tapAt(TAP.knife, 'タップして とる');
    prop('rackKnife', false); prop('heroKnife', true);
    await freeWalk('back');
    heroFace(14.72, -13.57);

    // 子供A（青い子）が やってくる：カメラは 引いた まま 動かさない
    look(10.0, -11.4, 1.5, true);
    sitActor(kidA, 4.2, -8.7, Math.PI / 2);
    await wait(500);
    await walkPath(kidA, [[11.4, -8.9], [11.6, -13.4]], 2.6);
    lookAt(kidA, heroX(), heroZ());
    await KA('あ！お兄さんケーキ切ってくれるの？');
    heroFace(kidA.x, kidA.z);
    await H('？');
    await KA('違うの…？');
    await H('（青い子だ…。）');

    const first = await choose(['切ってあげる', '嘘をつく']);
    look(12.4, -13.0, .9);
    let kind = true;                                   // ①❶❷ … やさしく 切った
    if (first === '切ってあげる') {
      await H('そうだよ。切ろうとしてたところ。');
      await KA('やったー！おいらたち、7人いるからお兄さんの分含めて8個分ね！');
      await H('8等分か。やってみよう。');
      heroFace(14.72, -13.57);
      await cutTheCake();
    } else {
      await H('違う。美味しそうだなって見てただけだよ。');
      await KA('でもナイフ…。あ…、もしかしてお客さん！？じゃあおいらが切ってあげるよ！');
      // 子供Aが 切って 失敗する（3を えらぶと、時が もどって ここから やりなおす）
      let rewound = false;
      while (true) {
        if (!rewound) await kidTries();
        rewound = false;
        const c = await choose(['切り方を教える', '代わりに切る', '…。']);
        if (c === '切り方を教える') {
          await H('振り被らず、もっとゆっくりやれば綺麗に切れるよ。');
          await KA('おいら、実は初めてナイフを持ったんだ。ちょっとだけ怖いから、一緒に切って欲しい！');
          prop('tears', false); prop('kidKnife', false); prop('heroKnife', true);
          await walkActor(kidA, 13.0, -12.3, 400); lookAt(kidA, 14.72, -13.57);
          await walkHero(12.4, -13.3, 500); heroFace(14.72, -13.57);
        } else if (c === '代わりに切る') {
          await H('代わりに切るよ。');
          prop('tears', false); prop('kidKnife', false); prop('heroKnife', true);
          await KA('わっ！お兄さんありがとう！');
          await walkActor(kidA, 12.0, -12.0, 500); lookAt(kidA, 14.72, -13.57);
          await walkHero(13.2, -13.4, 500); heroFace(14.72, -13.57);
        } else {
          await H('…。');
          await KA('あ…、ごめんなさい…！');
          prop('kidKnife', false);
          await walkPath(kidA, [[11.4, -8.9], [4.0, -8.7]], 4.0); kidA.visible = false; prop('tears', false);
          prop('heroKnife', true);
          await walkHero(13.2, -13.4, 500); heroFace(14.72, -13.57);
          kind = false;
        }
        await H('椅子は6つか。7等分は難しいから、一度8個に切って残りは怪盗さんにあげよう。');
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
    if (kidA.visible) walkPath(kidA, [[11.4, -8.9], [-1.9, -8.9], [-2.2, -13.0]], 2.4);
    await freeWalk('table');
    heroFace(0, -15.5);
    await tapAt(TAP.table, 'タップして おく');
    prop('carry', false); cake('table');

    // ---------- ①❶❷：ダイニングで ----------
    sitActor(kidA, -1.41, -14.45, Math.PI / 2);
    await KA('お兄さんありがとう！すごく綺麗に切ってある！');
    await H('うん。一緒に食べようか。');
    look(0, -14.5);
    await walkHero(1.32, -13.6, 400);
    await Promise.all([sitDown(kidA, .18), sitHero(1.32, -14.45, 0, -14.45, -.15, 600)]);
    await wait(400);
    await KA('あ、あのね。おいら2つ欲しいんだ。');
    await H('2つ？一人で2つ食べるのか？');
    await KA('そ、それは……。');
    await H('君の他に、かいと…じゃなくてオーナーさんとあと5人の子がいるんだろう？みんな食べれるようにちょうど8個に切ったんだ。');
    await H('一人で2つ食べちゃったら、食べれない子が出てくる。それに、他の子も2つ食べたくなっちゃうんじゃないかな？');
    await KA('お、おいらは2個食べないよう！');
    await H('じゃあなんで2個って…。');
    await KA('…オーナーさんとおいらしか知らない秘密なんだけど、屋根裏においらと同じような子がもう一人いるんだ。');
    await KA('その子にもケーキをあげたい…。');
    await H('！');
    await H('そうだったのか…！じゃあ、今から渡しに行って、一緒に食べよう。');
    await KA('うん！ありがとう！');
    // 階段へ（プレイヤーが 歩く。子供Aは 先に 階段へ）
    await Promise.all([sitHero(null, 0, 0, 0, 0, 400), sitDown(kidA, 0, 400)]);
    walkPath(kidA, [[-1.9, -12.0], [0.5, -8.4], [5.6, -8.6], [5.6, -12.4]], 2.4);
    await freeWalk('stairs');
    await fadeOut('black', 700);

    // ---------- ○登った 先の 部屋の 扉の 前 ----------
    place('attic');
    cake('hidden'); prop('kidPlates', true);
    setHero(10.6, -11.6); heroFace(6.7, -12.9);
    sitActor(kidA, 7.8, -12.9, -Math.PI / 2);
    look(8.6, -11.8);
    await fadeIn(700);
    await KA('おーい！おやつ持ってきたよ！');
    await KB('やった！ありがとう。');
    await KA('一緒に食べよう！ケーキを切ってくれたお兄さんも一緒にいるんだけど、入っていいかな？');
    await KB('いいよー！');
    await openDoor('attic', 900);

    // ---------- ○屋根裏部屋 ----------
    sitActor(kidB, .68, -9.3, 0);
    look(1.4, -8.2);
    await Promise.all([walkPath(kidA, [[5.4, -12.9], [-.6, -8.6]], 2.4), (async () => { await wait(500); await walkHeroPath([[7.6, -12.9], [5.4, -12.9], [2.6, -8.9]], 2.4); })()]);
    lookAt(kidB, heroX(), heroZ()); heroFace(kidB.x, kidB.z); lookAt(kidA, kidB.x, kidB.z);
    await KB('こんにちは！');
    await H('こんにちは。');
    // 子供Aが おやつを ローテーブルに 置く
    await walkActor(kidA, -.4, -7.7, 600); lookAt(kidA, .68, -6.25);
    await bendPut(kidA, () => { prop('kidPlates', false); atticPlates(3); });
    lookAt(kidA, kidB.x, kidB.z);
    await KA('これ、お兄さんが切ってくれたの');
    await KB('へぇー！すごく綺麗に切れてる！');
    await KA('おいらも切ろうとしたんだけど、またうまく切れなくて…。お兄さんが助けてくれたんだ！');
    await KB('前まで切ろうともしなかったじゃないか！一歩前進だよ！');
    await KA('へへっ。');
    await H('なんの話をしているんだ？');
    await KA('あっ。おいら、自分の力のコントロールができないんだ。');
    await H('力のコントロール？');
    await KA('例えば、さっきのナイフとか何かを持つときに、正しい力の加減がわからないんだ。');
    await KA('でも、今日は僕の誕生日だから、何か力に変化が起きているかもしれないって思って、挑戦しちゃった。');
    await H('力加減がわからない…。');
    await KA('だから、お兄さんが助けてくれて良かった！');
    await H('ううん。怪我がなくて良かったよ。一緒に食べてお誕生日のお祝いをしよう。');
    await say('子供A・B', 'うん！');
    // 3人で 談笑しながら 食べる
    // テーブルを かこんで すわる
    look(.7, -6.6);
    await Promise.all([
      walkPath(kidA, [[-2.0, -7.6], [-2.0, -6.25]], 1.6).then(() => { lookAt(kidA, .68, -6.25); return sitDown(kidA, -.1); }),
      walkPath(kidB, [[.68, -7.9]], 1.4).then(() => { kidB.rot = 0; return sitDown(kidB, -.1); }),
      walkHeroPath([[3.5, -7.6], [3.5, -6.25]], 1.6).then(() => sitHero(3.5, -6.25, 0, -6.25, -.42, 600)),
    ]);
    await eatPlates(2600);
    await wait(500);
    // 食べ終わりの 頃
    await KA('えー！お兄さんずっとここにいるわけじゃないの？');
    await H('うん。この世界から出なきゃ行けないんだ。');
    await KA('この世界？別の世界があるの？');
    await KB('…。');
    await KA('おいらたちもいつか新しい景色を見れたらいいね！');
    await KB('うん…。');
    await H('この世界から出るための鍵を探しているんだ。怪盗さんからはその鍵は「星」だって聞いた。');
    await KA('カイトウ？');
    await H('お、オーナーさん！');
    // 子供Aが ポケットから 星を 取り出して 見せる
    lookAt(kidA, heroX(), heroZ());
    look(-1.0, -6.4, .7);
    await KA('おいら、オーナーさんからもらった星を持ってるよ！');
    await showStar();
    await KA('お兄さんが探してるのってこれ？');
    await H('星だ。');
    await KA('お兄さんになら、おいらこれあげてもいいよ！');
    await H('本当か？');
    await KA('うん！お兄さん、ケーキ切る時も優しくしてくれたし、おいらがケーキ2つ持って行こうとしたら、怒るんじゃなくて話を聞いてくれたし。');
    await KA('今日会ったのが信じられないくらい、お兄さんといると落ち着くんだ！お兄さんのこと大好きだから、あげる！');
    await H('ありがとう。');
    await giveStar();
    note('星を 1つ 手に いれた！');
    look(.7, -6.6);
    await KA('また会えたらいいね。');
    await KB('でも、お兄さんにはお兄さんの世界があるんでしょ。会えないかもしれない。');
    await KA('そっかぁ。残念だな。じゃあ、お兄さんのこと一生忘れないようにする！');
    await KB('うん。');
    await H('ありがとう。');
    hideStar();
    await KB('次はどこに行くの？');
    const next = await choose(['分からない', '教えて欲しい']);
    if (next === '分からない') await H('分からない…。');
    else await H('次に行く所を、教えて欲しい。');
    await KB('お兄さんは星を集めているんだよね。そしたら、海辺に行くといいよ。');
    await H('海辺？');
    await KB('この部屋のドアから屋上に出て、降りた先の花道を辿れば、海辺に着くよ。');
    await H('そうか。行ってみるよ。');
    await KA('僕は片付けしておくから、Bが途中まで案内してあげなよ！今日の僕はなんだかできる気がする！');
    await KB('え？');
    // 子供Aが 立ち上がって、3枚の お皿を ゆっくり 集める
    await sitDown(kidA, 0, 500);
    //   テーブルを まわりこんで、手前から 1枚ずつ（机を 通りぬけない）
    await walkPath(kidA, [[-2.0, -4.75], [-.42, -4.75]], 1.2); lookAt(kidA, -.42, -6.25);
    await bendPut(kidA, () => { takePlate(0); prop('kidPlates', true); }, 1100);
    await walkActor(kidA, .68, -4.75, 700); lookAt(kidA, .68, -6.75);
    await bendPut(kidA, () => takePlate(1), 1100);
    await walkActor(kidA, 1.78, -4.75, 700); lookAt(kidA, 1.78, -6.25);
    await bendPut(kidA, () => takePlate(2), 1100);
    lookAt(kidA, heroX(), heroZ());
    await wait(500);
    await KA('ほら！持てた！洗い物をしちゃうぞー！へへっ。');
    await KA('Bはここら辺のことたくさん知ってるじゃん！僕よりもBの方が安心して案内できるよ！');
    await KA('あと、お兄さんともう会えないかもしれないなら、今のうちにたくさん話さなくちゃ。');
    await KB('あぁ…。じゃあ、途中までだけど、私が案内するよ。');
    await H('ありがとう。');
    heroFace(kidA.x, kidA.z); lookAt(kidA, heroX(), heroZ());
    await KA('お兄さん！じゃあね！おいらのこと、忘れないでね！');
    await H('うん。バイバイ。');
    // 子供Aに 見送られて、部屋の 片隅の ドアから 屋上へ（子供Bが 先に 扉を 開けて 出る。主人公は プレイヤーが 歩く）
    await Promise.all([sitHero(null, 0, 0, 0, 0, 400), sitDown(kidB, 0, 400)]);
    (async () => {
      await walkPath(kidB, [[-2.4, -7.9], [-5.4, -4.6], [-6.0, -1.6]], 1.6);
      await openDoor('exit', 700);
      await walkActor(kidB, -7.7, -1.6, 700); kidB.visible = false;
    })();
    await freeWalk('exit');
    await fadeOut('black', 900);
    end('場面2 おわり\n\n（つぎは 場面3「夜空に近い屋上」）');

    // ---------- 場面2で くりかえし 使う できごと ----------
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
      await KA('は、初めてのケーキ切りだ！真ん中を切ればいいんだよね？そ、それっ！');
      await kidChop(700);
      prop('badCut', true);
      await KA('あ、あれ…。');
      lookAt(kidA, heroX(), heroZ());
      prop('tears', true);
      await KA('今のおいらならできると思ったんだけどな…。やっぱり、お兄さんが切った方が良かったんだ。');
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
      await KA('お、お兄さん！ケーキ切ってくれてありがとう。');
      await H('うん。');
      await KA('おいらも食べていい？');
      await H('うん。');
      sitHero(1.32, -14.45, 0, -14.45); look(0, -14.5);
      await eatSlices(1, 600);                                 // 主人公が 1つ 食べる
      await walkActor(kidA, -.9, -14.4, 500); lookAt(kidA, 0, -15.5);
      await tapAt(TAP.kidHand, 'タップ');                      // 2つ 取ろうと する 手を
      await KA('いてっ！');
      await H('人数分で切っているから、1人1個までだよ。');
      await KA('と、友達に渡しに行こうと思って…。');
      await H('そうか。');
      await KA('うん。じゃあ、持っていくね。');
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
