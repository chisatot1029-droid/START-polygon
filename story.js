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
//   breakWall() / repairWall()   … 左の かべを こわす ／ もとに もどす（時が もどった 時）
//   （プレイヤーが 自由に 歩ける 間は、進む 方向に 矢印が 出ます）
//   主人公M（心の声）は （ ） で かこむ
// ============================================================

const STORY = {
  map: {
    width: 1194,
    height: 3336,
    floorLeft: 255,
    floorRight: 948,
    floorBottom: 3214,
    walls: [
      { x1: 255, x2: 545, y1: 1238, y2: 1424 },
      { x1: 667, x2: 948, y1: 1238, y2: 1424 },
      { x1: 255, x2: 545, y1: 30, y2: 245 },
      { x1: 667, x2: 948, y1: 30, y2: 245 },
    ],
  },
  playerStart: { x: 603, y: 3192 },
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
        // 助けに行くか 迷う：「この場に残る」なら「…。」で また えらぶ
        while (true) {
          await say('主人公', '…。', { face: 'hero' });
          const c = await choose(['助けに行く', 'この場に残る']);
          if (c === '助けに行く') break;
        }
        flags.heard = true;
        // ①：再び 自由に 動ける
      },
    },
    {
      id: 'watch',
      y: 3080,
      if: () => flags.loop === 1 && flags.heard,
      run: async () => {
        show('watch');
        show('ring');
        await say('時計', 'ピピピピピピッ…。');
        await say('主人公', 'なんだ？\n時計なんて持っていたか？', { face: 'hero' });
        await walkTo(2960, 1400);                                           // ゆっくり 歩き出すと
        hide('ring');                                                       // アラームが 鳴り、止まる
        await say('時計', 'ピッ…。');
        await say('主人公', '勝手に止まった。\n一体何だったんだ。', { face: 'hero' });
        hide('watch');
      },
    },
    {
      // ---------- ○広い部屋 ----------
      id: 'encounter1',
      y: 1080,
      if: () => flags.loop === 1,
      run: async () => {
        await camera(140, 900);
        await say('???', 'やっと助けが来たのか！', { face: 'captive' });     // 笑顔で 言う
        await say('主人公', '（な、なんだこのバケモノは…！）', { face: 'hero' });
        await wait(800);                                                    // 立ち尽くす
        monster('eat');                                                     // あっという間に 食べられる
        await wait(900);
        monster('alone');
        await wait(500);
        await say('バケモノ', '…。', { face: 'monster' });
        await wait(800);                                                    // 主人公を じっと 見つめ
        const away = monsterWalk(-1300, 5200);                              // ゆっくり 歩き、
        await wait(520);                                                    // （大きいので すぐ かべに とどく）
        breakWall();                                                        // 壁を 壊して
        await away;                                                         // 去る
        monster('none');
        await walkTo(900, 700);
        await say('主人公', 'え…。死んだ？\n何が起きたんだ？', { face: 'hero' });
        await wait(1200);                                                   // 呆然と する 主人公

        // 2回目の 時計：プレイヤーが 自分で 止める
        show('watch');
        show('ring');
        await say('時計', 'ピピピピッ。');
        await say('主人公', 'こんな時にまたかよ。', { face: 'hero' });
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
      y: 1080,
      if: () => flags.loop === 2,
      run: async () => {
        flags.run = false;
        await camera(140, 900);
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
        await monsterWalk(600, 1500);
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
        await say('警察', 'そうか。最近物騒になってきたから\n気をつけろよ。');
        await say('警察', '…君、お家は？');
        await say('主人公', '（僕の家は…。）', { face: 'hero' });
        await say('主人公', '（まずい、すぐ答えなかったら\n不審がられる。）', { face: 'hero' });
        await say('主人公', 'えーと。', { face: 'hero' });

        // 家を 答える 選択肢（③巻き戻す を えらぶと ここに もどる）
        let act;
        while (true) {
          const answer = await choose(['すぐそこです。', '3つ隣の街で…。', '…。']);
          await say('主人公', answer, { face: 'hero' });
          if (answer === 'すぐそこです。') await say('警察', 'ここら辺に登録されてる\n住宅地はないぞ。');
          else if (answer === '3つ隣の街で…。') await say('警察', 'ここは他の街の者は\n立ち入り禁止だぞ。');
          else await say('警察', '答えられないのか？');
          await say('警察', 'どういうことだ？君、\n少しだけ話を聞いても良いかな？');   // 動揺する 主人公を 怪しむ
          await say('主人公', 'このままだとまずい！', { face: 'hero' });
          act = await choose(['戦う', '逃げる', '巻き戻す']);
          if (act !== '巻き戻す') break;
          // ③：家を 答える 選択肢の 場面に 巻き戻される
          show('watch');
          await wait(300);
          await fadeOut('white', 300);
          hide('watch');
          await fadeIn(400);
        }
        if (act === '戦う') {
          await say('主人公', 'いっそ戦うか…！', { face: 'hero' });
          await walkTo(900, 500);                                           // 警察に むかって 一歩
        } else {
          await say('主人公', '逃げろっ！', { face: 'hero' });
          await walkTo(1120, 500);                                          // 逃げようと する
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
        end('場面1 おわり\n\n（つぎは 場面2「緑が多い暖かな家の中」）');
      },
    },
  ],
};
