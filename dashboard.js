/* ============================================================
   CARD ANALYST DASHBOARD
   CLEAN REBUILD
   ============================================================ */

(() => {
  'use strict';

  const CA_BUILD = 'CA1400-PROFILE-SHELL';

  /* ==========================================================
     GLOBAL STYLE
     ========================================================== */

  const caStyle =
    document.createElement('style');

  caStyle.textContent = `

    /* ======================================================
       GLOBAL APP POLISH
       ====================================================== */

    body.caWide .app{
      max-width:1180px;
    }

    body.caWide .nav{
      width:min(1180px,100%);
    }

    .brand{
      letter-spacing:-1.1px;
    }


    /* ======================================================
       PRIMARY NAVIGATION
       Portfolio | Add | Flips
       ====================================================== */

    #nav{
      grid-template-columns:
        repeat(3,1fr)!important;

      gap:7px!important;

      padding:
        8px
        9px
        calc(
          8px +
          env(safe-area-inset-bottom)
        )!important;
    }

    #nav button{
      min-height:60px;

      border-radius:15px!important;

      font-size:10px!important;

      transition:
        background .15s ease,
        border-color .15s ease,
        color .15s ease;
    }

    #nav button.active{
      background:#18201c!important;
      border-color:#314137!important;
      color:#fff!important;
    }

    #flipnav{
      background:#151c18!important;
      border-color:#2a3931!important;
      color:#acdabb!important;
    }

    #flipnav.active{
      background:#edf8f0!important;
      border-color:#edf8f0!important;
      color:#07120a!important;
    }


    /* ======================================================
       TOP-RIGHT PROFILE + SETTINGS
       ====================================================== */

    .caTopTools{
      position:fixed;

      z-index:50;

      top:calc(
        12px +
        env(safe-area-inset-top)
      );

      right:max(
        16px,
        calc(
          (100vw - 560px) / 2 +
          16px
        )
      );

      display:flex;
      align-items:center;

      gap:7px;
    }

    .caTopButton{
      width:41px;
      height:41px;

      padding:0;

      border-radius:999px;

      border:
        1px solid #293338;

      background:
        rgba(17,22,25,.94);

      color:#f4f7f5;

      display:flex;
      align-items:center;
      justify-content:center;

      overflow:hidden;

      -webkit-backdrop-filter:
        blur(14px);

      backdrop-filter:
        blur(14px);
    }

    .caTopButton img{
      width:100%;
      height:100%;

      object-fit:cover;
      object-position:center;

      display:block;
    }

    .caProfileTopButton{
      font-size:10px;
      font-weight:950;
    }

    .caSettingsTopButton{
      font-size:18px;
    }


    /* ======================================================
       SETTINGS DRAWER
       ====================================================== */

    .caDrawerBg{
      position:fixed;

      inset:0;

      z-index:90;

      background:
        rgba(0,0,0,.62);

      display:flex;
      justify-content:flex-end;

      opacity:0;

      pointer-events:none;

      transition:
        opacity .18s ease;
    }

    .caDrawerBg.open{
      opacity:1;

      pointer-events:auto;
    }

    .caDrawer{
      width:min(
        350px,
        88vw
      );

      height:100%;

      overflow-y:auto;

      padding:
        calc(
          18px +
          env(safe-area-inset-top)
        )
        15px
        calc(
          24px +
          env(safe-area-inset-bottom)
        );

      background:#0c1012;

      border-left:
        1px solid #263035;

      transform:
        translateX(100%);

      transition:
        transform .2s ease;
    }

    .caDrawerBg.open
    .caDrawer{
      transform:
        translateX(0);
    }

    .caDrawerHeader{
      display:flex;
      align-items:center;
      justify-content:
        space-between;

      margin-bottom:18px;
    }

    .caDrawerHeader b{
      font-size:21px;

      letter-spacing:-.45px;
    }

    .caDrawerClose{
      width:36px;
      height:36px;

      border-radius:999px;

      border:
        1px solid #293338;

      background:#151a1d;

      color:#fff;

      font-size:19px;
    }


    /* ======================================================
       DRAWER PROFILE PREVIEW
       ====================================================== */

    .caDrawerProfile{
      width:100%;

      border:
        1px solid #283237;

      border-radius:17px;

      background:#101518;

      color:#fff;

      padding:12px;

      display:grid;

      grid-template-columns:
        50px 1fr auto;

      gap:10px;

      align-items:center;

      text-align:left;
    }

    .caDrawerAvatar{
      width:50px;
      height:50px;

      border-radius:13px;

      border:
        1px solid #2b363b;

      background:#080b0d;

      overflow:hidden;

      display:flex;
      align-items:center;
      justify-content:center;

      font-size:10px;
      font-weight:950;
    }

    .caDrawerAvatar img{
      width:100%;
      height:100%;

      object-fit:cover;

      display:block;
    }

    .caDrawerProfileName{
      font-size:13px;
      font-weight:900;
    }

    .caDrawerProfileSub{
      margin-top:3px;

      color:#818c87;

      font-size:9px;
    }

    .caDrawerArrow{
      color:#74807a;

      font-size:18px;
    }


    /* ======================================================
       DRAWER GROUPS
       ====================================================== */

    .caDrawerLabel{
      margin:
        20px
        4px
        6px;

      color:#69746f;

      font-size:9px;
      font-weight:900;

      letter-spacing:.75px;

      text-transform:uppercase;
    }

    .caDrawerItem{
      width:100%;

      margin-top:7px;

      padding:13px;

      border-radius:13px;

      border:
        1px solid #242d31;

      background:#101518;

      color:#eef4f1;

      display:flex;
      align-items:center;
      justify-content:
        space-between;

      text-align:left;

      font-size:12px;
      font-weight:850;
    }

    .caDrawerItem span{
      color:#7e8984;
    }

    .caDrawerItem.private{
      background:#151b18;

      border-color:#34433c;
    }


    /* ======================================================
       PROFILE PAGE
       ====================================================== */

    .caProfilePage{
      max-width:760px;

      margin:0 auto;

      padding-bottom:35px;
    }

    .caProfileHero{
      display:grid;

      grid-template-columns:
        185px 1fr;

      gap:20px;

      align-items:center;

      padding:
        8px
        0
        18px;
    }

    .caSignatureCard{
      width:185px;
      height:250px;

      padding:8px;

      border-radius:20px;

      border:
        1px solid #293338;

      background:#090c0e;

      display:flex;
      align-items:center;
      justify-content:center;

      overflow:hidden;
    }

    .caSignatureCard img{
      width:100%;
      height:100%;

      object-fit:contain;

      display:block;
    }

    .caSignatureEmpty{
      color:#69746f;

      font-size:10px;
      font-weight:850;

      line-height:1.45;

      text-align:center;

      padding:16px;
    }

    .caProfileEyebrow{
      color:#76817c;

      font-size:9px;
      font-weight:900;

      letter-spacing:.75px;

      text-transform:uppercase;
    }

    .caProfileName{
      margin-top:5px;

      font-size:31px;
      font-weight:950;

      letter-spacing:-.9px;

      line-height:1.05;
    }

    .caProfileBio{
      max-width:430px;

      margin-top:8px;

      color:#929c97;

      font-size:11px;
      line-height:1.5;
    }

    .caProfileMetrics{
      display:grid;

      grid-template-columns:
        repeat(3,minmax(0,1fr));

      gap:8px;

      margin-top:14px;
    }

    .caProfileMetric{
      padding:11px;

      border:
        1px solid #242d31;

      border-radius:14px;

      background:#101518;
    }

    .caProfileMetric small{
      display:block;

      color:#707b76;

      font-size:8px;
      font-weight:850;

      text-transform:uppercase;

      margin-bottom:4px;
    }

    .caProfileMetric b{
      font-size:15px;
    }

    .caProfileActions{
      display:flex;

      gap:7px;

      margin-top:12px;
    }

    .caProfileAction{
      border:
        1px solid #2b363a;

      border-radius:12px;

      background:#151b1e;

      color:#fff;

      padding:
        10px
        12px;

      font-size:10px;
      font-weight:900;
    }

    .caProfileAction.primary{
      background:#eef8f1;

      border-color:#eef8f1;

      color:#07120a;
    }


    /* ======================================================
       PROFILE SECTIONS
       ====================================================== */

    .caSection{
      margin-top:24px;
    }

    .caSectionHead{
      display:flex;
      justify-content:
        space-between;
      align-items:end;

      margin-bottom:9px;
    }

    .caSectionHead h2{
      margin:0;

      font-size:18px;

      letter-spacing:-.3px;
    }

    .caSectionHead span{
      color:#77827d;

      font-size:9px;
    }

    .caPills{
      display:flex;

      flex-wrap:wrap;

      gap:6px;
    }

    .caPill{
      padding:
        6px
        9px;

      border-radius:999px;

      border:
        1px solid #293338;

      background:#111619;

      color:#b5c0ba;

      font-size:9px;
      font-weight:850;
    }


    /* ======================================================
       PUBLIC SHOWROOM
       ====================================================== */

    .caPublicShowroom{
      display:flex;

      gap:10px;

      overflow-x:auto;

      padding:
        2px
        2px
        12px;

      scroll-snap-type:
        x mandatory;

      -webkit-overflow-scrolling:
        touch;

      scrollbar-width:none;
    }

    .caPublicShowroom::-webkit-scrollbar{
      display:none;
    }

    .caPublicCard{
      flex:
        0
        0
        205px;

      scroll-snap-align:start;
    }

    .caPublicCardImage{
      height:280px;

      padding:8px;

      border-radius:18px;

      border:
        1px solid #293338;

      background:#080b0d;

      display:flex;
      align-items:center;
      justify-content:center;

      overflow:hidden;
    }

    .caPublicCardImage img{
      width:100%;
      height:100%;

      object-fit:contain;

      display:block;
    }

    .caPublicCardName{
      margin-top:8px;

      font-size:12px;
      font-weight:900;

      line-height:1.3;
    }

    .caPublicCardMeta{
      margin-top:3px;

      color:#7f8a85;

      font-size:9px;
      line-height:1.35;
    }

    .caPublicCardValue{
      margin-top:6px;

      font-size:15px;
      font-weight:900;
    }


    /* ======================================================
       COLLECTOR DISCOVERY
       ====================================================== */

    .caCollectorSearch{
      display:grid;

      grid-template-columns:
        1fr auto;

      gap:7px;

      margin-top:10px;
    }

    .caCollectorSearch
    .input{
      margin-top:0;
    }

    .caCollectorSearch button{
      border:0;

      border-radius:13px;

      padding:
        0
        15px;

      background:#eef8f1;

      color:#07120a;

      font-weight:900;
    }

    .caCollectors{
      display:grid;

      grid-template-columns:
        repeat(2,minmax(0,1fr));

      gap:8px;

      margin-top:10px;
    }

    .caCollectorCard{
      border:
        1px solid #273136;

      border-radius:15px;

      background:#101518;

      color:#fff;

      padding:11px;

      text-align:left;
    }

    .caCollectorTop{
      display:grid;

      grid-template-columns:
        42px 1fr;

      gap:8px;

      align-items:center;
    }

    .caCollectorAvatar{
      width:42px;
      height:42px;

      border-radius:11px;

      overflow:hidden;

      border:
        1px solid #293338;

      background:#080b0d;

      display:flex;
      align-items:center;
      justify-content:center;

      font-size:9px;
      font-weight:900;
    }

    .caCollectorAvatar img{
      width:100%;
      height:100%;

      object-fit:cover;

      display:block;
    }

    .caCollectorName{
      font-size:11px;
      font-weight:900;
    }

    .caCollectorValue{
      margin-top:3px;

      color:#87928d;

      font-size:9px;
    }


    /* ======================================================
       SHOWROOM / PORTFOLIO CLEANUP
       ====================================================== */

    #portfolio .coverage,
    #portfolio #chartmeta,
    #portfolio #trophycount{
      display:none!important;
    }

    #portfolio .trophytitle h2{
      font-size:23px!important;

      letter-spacing:-.45px!important;
    }

    #portfolio .trophyrail{
      gap:10px!important;
    }

    #portfolio .trophycard{
      flex:
        0
        0
        72%!important;

      max-width:
        245px!important;
    }

    #portfolio .cardframe{
      height:310px!important;

      padding:9px!important;

      border-radius:18px!important;

      background:#090c0e!important;

      display:flex!important;
      align-items:center!important;
      justify-content:center!important;

      overflow:hidden!important;
    }

    #portfolio .cardframe img{
      width:100%!important;
      height:100%!important;

      object-fit:contain!important;
      object-position:center!important;

      display:block!important;
    }

    #portfolio .trophyname{
      font-size:14px!important;

      font-weight:900!important;
    }

    #portfolio .trophyprice{
      font-size:19px!important;
    }


    /* ======================================================
       MODERATOR IMAGE CONTROL
       ====================================================== */

    .imgreview{
      display:none!important;
    }

    .caChangeImage{
      width:100%;

      margin-top:14px;

      padding:10px;

      border-radius:12px;

      border:
        1px solid #293338;

      background:#121719;

      color:#aab5b0;

      font-size:10px;
      font-weight:850;
    }

    .caImageReview{
      margin-top:12px;

      padding:12px;

      border-radius:16px;

      border:
        1px solid #293338;

      background:#0d1113;
    }

    .caImageReview img{
      width:100%;

      max-height:430px;

      object-fit:contain;

      background:#080b0d;

      border-radius:12px;

      display:block;
    }

    .caImageReviewTitle{
      margin-top:10px;

      font-size:13px;
      font-weight:900;
    }

    .caImageReviewMeta{
      margin-top:4px;

      color:#818c87;

      font-size:9px;
      line-height:1.4;
    }

    .caImageReviewActions{
      display:grid;

      grid-template-columns:
        1fr 1fr;

      gap:8px;

      margin-top:10px;
    }

    .caImageYes,
    .caImageNo{
      padding:11px;

      border-radius:11px;

      font-weight:900;
    }

    .caImageYes{
      border:0;

      background:#eef8f1;

      color:#07120a;
    }

    .caImageNo{
      border:
        1px solid #313b40;

      background:#171b1d;

      color:#fff;
    }


    /* ======================================================
       RESEARCH TABS
       ====================================================== */

    .caResearchTabs{
      display:grid;

      grid-template-columns:
        1fr 1fr;

      gap:5px;

      padding:4px;

      margin-bottom:12px;

      border:
        1px solid #242d31;

      border-radius:14px;

      background:#0b0f11;
    }

    .caResearchTabs button{
      border:0;

      border-radius:10px;

      padding:10px;

      background:transparent;

      color:#77827d;

      font-size:10px;
      font-weight:900;
    }

    .caResearchTabs button.active{
      background:#eef8f1;

      color:#07120a;
    }


    /* ======================================================
       MOBILE
       ====================================================== */

    @media(max-width:640px){

      .caProfileHero{
        grid-template-columns:1fr;

        text-align:center;
      }

      .caSignatureCard{
        margin:0 auto;
      }

      .caProfileBio{
        margin-left:auto;
        margin-right:auto;
      }

      .caProfileActions{
        justify-content:center;
      }

      .caCollectors{
        grid-template-columns:1fr;
      }

    }


    @media(max-width:390px){

      .caTopTools{
        right:12px;
      }

      .caTopButton{
        width:38px;
        height:38px;
      }

      #portfolio .trophycard{
        flex-basis:76%!important;
      }

      #portfolio .cardframe{
        height:285px!important;
      }

      .caProfileMetrics{
        grid-template-columns:
          repeat(2,minmax(0,1fr));
      }

    }

  `;

  document.head.appendChild(
    caStyle
  );


  /* ==========================================================
     STATE
     ========================================================== */

  const CA = {
    me:null,

    viewingProfile:null,

    viewingShowroom:[],

    collectors:[],

    imageModerator:false,

    lockState:{
      has_passcode:false,
      flips_locked:true,
      goose_locked:true
    },

    initialized:false
  };


  /* ==========================================================
     HELPERS
     ========================================================== */

  const caEsc =
    value =>
      String(value ?? '')
        .replace(
          /[&<>"']/g,
          ch => ({
            '&':'&amp;',
            '<':'&lt;',
            '>':'&gt;',
            '"':'&quot;',
            "'":'&#39;'
          })[ch]
        );


  const caMoney =
    value => {

      const n =
        Number(value);

      return Number.isFinite(n)
        ? new Intl.NumberFormat(
            'en-US',
            {
              style:'currency',
              currency:'USD',
              maximumFractionDigits:
                Math.abs(n) < 100
                  ? 2
                  : 0
            }
          ).format(n)
        : '—';

    };


  const caArray =
    value =>
      Array.isArray(value)
        ? value
        : [];


  const caCsvArray =
    value =>
      String(value || '')
        .split(',')
        .map(
          x => x.trim()
        )
        .filter(Boolean);


  const caOwnsCard =
    cardId =>
      !!(
        S.h || []
      ).find(
        h =>
          h.cards?.id ===
            cardId &&
          Number(
            h.quantity || 0
          ) > 0
      );


  const caUnlocked =
    feature =>
      sessionStorage.getItem(
        `ca_unlock_${feature}`
      ) === '1';


  const caMarkUnlocked =
    feature =>
      sessionStorage.setItem(
        `ca_unlock_${feature}`,
        '1'
      );


  const caClearUnlocks =
    () => {

      sessionStorage.removeItem(
        'ca_unlock_flips'
      );

      sessionStorage.removeItem(
        'ca_unlock_goose'
      );

    };


  const caSetWide =
    on =>
      document.body.classList.toggle(
        'caWide',
        !!on
      );


  const caProfileInterests =
    profile => [
      ...caArray(
        profile?.favorite_sports
      ),

      ...caArray(
        profile?.favorite_teams
      ),

      ...caArray(
        profile?.favorite_players
      )
    ];


  /* ==========================================================
     END CHUNK 1
     Continue immediately with Chunk 2.
     ========================================================== */
   /* ==========================================================
     PROFILE / PUBLIC DATA LOADERS
     ========================================================== */

  async function caLoadMe(){

    try{

      const rows =
        await api(
          '/rest/v1/rpc/get_public_profile_v1',
          {
            method:'POST',
            body:JSON.stringify({
              p_user_id:uid()
            })
          }
        );

      CA.me =
        Array.isArray(rows)
          ? rows[0] || null
          : null;

    }catch(e){

      console.warn(
        'Could not load profile',
        e
      );

      CA.me =
        null;

    }


    try{

      CA.imageModerator =
        !!(
          await api(
            '/rest/v1/rpc/is_image_moderator_v1',
            {
              method:'POST',
              body:JSON.stringify({})
            }
          )
        );

    }catch(e){

      CA.imageModerator =
        false;

    }


    try{

      CA.lockState =
        await api(
          '/rest/v1/rpc/feature_lock_status_v1',
          {
            method:'POST',
            body:JSON.stringify({})
          }
        );

    }catch(e){

      console.warn(
        'Could not load feature lock status',
        e
      );

    }


    caRenderTopButtons();
    caRenderDrawerProfile();

  }


  async function caLoadPublicProfile(
    userId
  ){

    const rows =
      await api(
        '/rest/v1/rpc/get_public_profile_v1',
        {
          method:'POST',
          body:JSON.stringify({
            p_user_id:userId
          })
        }
      );


    CA.viewingProfile =
      Array.isArray(rows)
        ? rows[0] || null
        : null;


    const showroom =
      await api(
        '/rest/v1/rpc/get_public_showroom_v1',
        {
          method:'POST',
          body:JSON.stringify({
            p_user_id:userId
          })
        }
      );


    CA.viewingShowroom =
      Array.isArray(showroom)
        ? showroom
        : [];

  }


  async function caSearchCollectors(
    query = ''
  ){

    try{

      const rows =
        await api(
          '/rest/v1/rpc/list_public_profiles_v1',
          {
            method:'POST',
            body:JSON.stringify({
              p_query:
                query || null,

              p_limit:
                40
            })
          }
        );


      CA.collectors =
        Array.isArray(rows)
          ? rows
          : [];

    }catch(e){

      console.warn(
        'Collector search failed',
        e
      );

      CA.collectors =
        [];

    }

  }


  /* ==========================================================
     TOP BUTTONS
     ========================================================== */

  let caTopTools =
    document.getElementById(
      'caTopTools'
    );


  if(!caTopTools){

    caTopTools =
      document.createElement(
        'div'
      );


    caTopTools.id =
      'caTopTools';


    caTopTools.className =
      'caTopTools';


    caTopTools.innerHTML = `
      <button
        id="caProfileTopButton"
        class="
          caTopButton
          caProfileTopButton
        "
        aria-label="Profile"
      >
        CA
      </button>

      <button
        id="caSettingsTopButton"
        class="
          caTopButton
          caSettingsTopButton
        "
        aria-label="Settings"
      >
        ⚙
      </button>
    `;


    document.body.appendChild(
      caTopTools
    );

  }


  function caRenderTopButtons(){

    const profileBtn =
      document.getElementById(
        'caProfileTopButton'
      );


    if(!profileBtn){
      return;
    }


    if(
      CA.me
        ?.avatar_image_url
    ){

      profileBtn.innerHTML = `
        <img
          src="${
            caEsc(
              CA.me.avatar_image_url
            )
          }"
          alt="Profile card"
        >
      `;

    }else{

      profileBtn.textContent =
        'CA';

    }

  }


  document
    .getElementById(
      'caProfileTopButton'
    )
    .onclick =
      async () => {

        await caOpenProfile(
          uid()
        );

      };


  /* ==========================================================
     PROFILE SECTION
     ========================================================== */

  let caProfileSection =
    document.getElementById(
      'caProfilePage'
    );


  if(!caProfileSection){

    caProfileSection =
      document.createElement(
        'section'
      );


    caProfileSection.id =
      'caProfilePage';


    caProfileSection.className =
      'hidden';


    const app =
      document.querySelector(
        '.app'
      );


    app?.appendChild(
      caProfileSection
    );

  }


  function caSignatureHtml(
    profile
  ){

    if(
      profile
        ?.avatar_image_url
    ){

      return `
        <img
          src="${
            caEsc(
              profile
                .avatar_image_url
            )
          }"
          alt="Signature card"
        >
      `;

    }


    return `
      <div
        class="caSignatureEmpty"
      >
        No signature card selected.
      </div>
    `;

  }


  function caPublicShowroomHtml(){

    if(
      !CA.viewingShowroom.length
    ){

      return `
        <div
          class="muted"
          style="
            font-size:11px;
            padding:15px 0;
          "
        >
          No active cards in this Showroom.
        </div>
      `;

    }


    return CA.viewingShowroom
      .map(
        card => `
          <div
            class="caPublicCard"
          >

            <div
              class="caPublicCardImage"
            >

              ${
                card.image_url
                  ? `
                    <img
                      src="${
                        caEsc(
                          card.image_url
                        )
                      }"
                      alt="Card"
                    >
                  `
                  : `
                    <div
                      class="caSignatureEmpty"
                    >
                      Image pending
                    </div>
                  `
              }

            </div>


            <div
              class="caPublicCardName"
            >
              ${
                caEsc(
                  card.player_name ||
                  card.display_name ||
                  'Card'
                )
              }
            </div>


            <div
              class="caPublicCardMeta"
            >
              ${
                caEsc(
                  [
                    card.year,
                    card.set_name,
                    card.card_number
                      ? '#' +
                        card.card_number
                      : null,
                    card.parallel
                  ]
                    .filter(Boolean)
                    .join(' · ')
                )
              }
            </div>


            <div
              class="caPublicCardValue"
            >
              ${
                caMoney(
                  card.market_value
                )
              }
            </div>

          </div>
        `
      )
      .join('');

  }


  function caRenderCollectors(){

    const box =
      document.getElementById(
        'caCollectorResults'
      );


    if(!box){
      return;
    }


    const others =
      CA.collectors.filter(
        p =>
          p.user_id !== uid()
      );


    box.innerHTML =
      others.length
        ? others
            .map(
              p => `
                <button
                  class="caCollectorCard"
                  data-ca-profile="${
                    caEsc(
                      p.user_id
                    )
                  }"
                >

                  <div
                    class="caCollectorTop"
                  >

                    <div
                      class="caCollectorAvatar"
                    >

                      ${
                        p.avatar_image_url
                          ? `
                            <img
                              src="${
                                caEsc(
                                  p.avatar_image_url
                                )
                              }"
                              alt="Profile"
                            >
                          `
                          : 'CA'
                      }

                    </div>


                    <div>

                      <div
                        class="caCollectorName"
                      >
                        ${
                          caEsc(
                            p.display_name ||
                            'Collector'
                          )
                        }
                      </div>


                      <div
                        class="caCollectorValue"
                      >
                        ${
                          caMoney(
                            p.collection_value
                          )
                        }
                        ·
                        ${
                          Number(
                            p.card_count ||
                            0
                          )
                        }
                        cards
                      </div>

                    </div>

                  </div>

                </button>
              `
            )
            .join('')
        : `
          <div
            class="muted"
            style="
              grid-column:1/-1;
              font-size:11px;
              padding:10px 0;
            "
          >
            No collectors found.
          </div>
        `;


    box
      .querySelectorAll(
        '[data-ca-profile]'
      )
      .forEach(
        btn => {

          btn.onclick =
            async () => {

              await caOpenProfile(
                btn.dataset.caProfile
              );

            };

        }
      );

  }


  function caProfileActionHtml(
    profile
  ){

    if(
      profile?.user_id === uid()
    ){

      return `
        <div
          class="caProfileActions"
        >

          <button
            id="caEditProfileButton"
            class="
              caProfileAction
              primary
            "
          >
            Edit profile
          </button>

          <button
            id="caSignatureButton"
            class="caProfileAction"
          >
            Signature card
          </button>

        </div>
      `;

    }


    return '';

  }


  function caRenderProfile(){

    if(
      !CA.viewingProfile
    ){

      caProfileSection.innerHTML = `
        <div
          class="empty"
        >
          Profile unavailable.
        </div>
      `;

      return;

    }


    const profile =
      CA.viewingProfile;


    const interests =
      caProfileInterests(
        profile
      );


    caProfileSection.innerHTML = `
      <div
        class="caProfilePage"
      >

        <div
          class="caProfileHero"
        >

          <div
            class="caSignatureCard"
          >
            ${
              caSignatureHtml(
                profile
              )
            }
          </div>


          <div>

            <div
              class="caProfileEyebrow"
            >
              Card Analyst Collector
            </div>


            <div
              class="caProfileName"
            >
              ${
                caEsc(
                  profile.display_name ||
                  'Collector'
                )
              }
            </div>


            <div
              class="caProfileBio"
            >
              ${
                caEsc(
                  profile.bio ||
                  'Sports card collector'
                )
              }
            </div>


            <div
              class="caProfileMetrics"
            >

              <div
                class="caProfileMetric"
              >
                <small>
                  Portfolio
                </small>

                <b>
                  ${
                    caMoney(
                      profile
                        .collection_value
                    )
                  }
                </b>
              </div>


              <div
                class="caProfileMetric"
              >
                <small>
                  Cards
                </small>

                <b>
                  ${
                    Number(
                      profile.card_count ||
                      0
                    )
                  }
                </b>
              </div>


              <div
                class="caProfileMetric"
              >
                <small>
                  Member since
                </small>

                <b>
                  ${
                    profile.created_at
                      ? new Date(
                          profile
                            .created_at
                        )
                          .toLocaleDateString(
                            undefined,
                            {
                              month:'short',
                              year:'numeric'
                            }
                          )
                      : '—'
                  }
                </b>
              </div>

            </div>


            ${
              caProfileActionHtml(
                profile
              )
            }

          </div>

        </div>


        ${
          interests.length
            ? `
              <div
                class="caSection"
              >

                <div
                  class="caSectionHead"
                >
                  <h2>
                    Collector interests
                  </h2>
                </div>


                <div
                  class="caPills"
                >

                  ${
                    interests
                      .map(
                        item => `
                          <span
                            class="caPill"
                          >
                            ${
                              caEsc(
                                item
                              )
                            }
                          </span>
                        `
                      )
                      .join('')
                  }

                </div>

              </div>
            `
            : ''
        }


        <div
          class="caSection"
        >

          <div
            class="caSectionHead"
          >
            <h2>
              Showroom
            </h2>

            <span>
              ${
                CA.viewingShowroom
                  .length
              }
              active
            </span>
          </div>


          <div
            class="caPublicShowroom"
          >
            ${
              caPublicShowroomHtml()
            }
          </div>

        </div>


        <div
          class="caSection"
        >

          <div
            class="caSectionHead"
          >
            <h2>
              Discover collectors
            </h2>

            <span>
              Public profiles
            </span>
          </div>


          <div
            class="caCollectorSearch"
          >

            <input
              id="caCollectorSearchInput"
              class="input"
              placeholder="Search collectors"
            >

            <button
              id="caCollectorSearchButton"
            >
              Search
            </button>

          </div>


          <div
            id="caCollectorResults"
            class="caCollectors"
          ></div>

        </div>

      </div>
    `;


    if(
      profile.user_id === uid()
    ){

      document
        .getElementById(
          'caEditProfileButton'
        )
        ?.addEventListener(
          'click',
          caOpenProfileEditor
        );


      document
        .getElementById(
          'caSignatureButton'
        )
        ?.addEventListener(
          'click',
          caOpenSignatureChooser
        );

    }


    document
      .getElementById(
        'caCollectorSearchButton'
      )
      ?.addEventListener(
        'click',
        async () => {

          const q =
            document
              .getElementById(
                'caCollectorSearchInput'
              )
              ?.value
              ?.trim() ||
            '';


          await caSearchCollectors(
            q
          );


          caRenderCollectors();

        }
      );


    document
      .getElementById(
        'caCollectorSearchInput'
      )
      ?.addEventListener(
        'keydown',
        async e => {

          if(
            e.key !==
            'Enter'
          ){
            return;
          }


          const q =
            e.currentTarget
              .value
              .trim();


          await caSearchCollectors(
            q
          );


          caRenderCollectors();

        }
      );


    caRenderCollectors();

  }


  async function caOpenProfile(
    userId
  ){

    try{

      await Promise.all([
        caLoadPublicProfile(
          userId
        ),

        caSearchCollectors('')
      ]);


      caHideAllMainSections();


      caProfileSection
        .classList.remove(
          'hidden'
        );


      document
        .querySelectorAll(
          '#nav button'
        )
        .forEach(
          btn =>
            btn.classList.remove(
              'active'
            )
        );


      caSetWide(
        false
      );


      caRenderProfile();


      window.scrollTo({
        top:0,
        behavior:'smooth'
      });

    }catch(e){

      alert(
        e?.message ||
        'Could not open profile.'
      );

    }

  }


  /* ==========================================================
     PROFILE EDITOR
     ========================================================== */

  function caOpenProfileEditor(){

    const p =
      CA.me ||
      CA.viewingProfile ||
      {};


    $('sheet').innerHTML = `
      <button
        class="backbtn"
        onclick="closeSheet()"
      >
        ← Back
      </button>

      <div
        class="muted"
      >
        PUBLIC PROFILE
      </div>

      <h2>
        Edit profile
      </h2>


      <div
        class="card"
      >

        <input
          id="caProfileNameInput"
          class="input"
          value="${
            caEsc(
              p.display_name ||
              ''
            )
          }"
          placeholder="Display name"
        >


        <input
          id="caProfileBioInput"
          class="input"
          value="${
            caEsc(
              p.bio ||
              ''
            )
          }"
          placeholder="Collector bio"
        >


        <input
          id="caProfileSportsInput"
          class="input"
          value="${
            caEsc(
              caArray(
                p.favorite_sports
              ).join(', ')
            )
          }"
          placeholder="Favorite sports"
        >


        <input
          id="caProfileTeamsInput"
          class="input"
          value="${
            caEsc(
              caArray(
                p.favorite_teams
              ).join(', ')
            )
          }"
          placeholder="Favorite teams"
        >


        <input
          id="caProfilePlayersInput"
          class="input"
          value="${
            caEsc(
              caArray(
                p.favorite_players
              ).join(', ')
            )
          }"
          placeholder="Favorite players"
        >


        <button
          id="caSaveProfileButton"
          class="btn primary"
        >
          Save profile
        </button>

      </div>
    `;


    openSheet();


    document
      .getElementById(
        'caSaveProfileButton'
      )
      .onclick =
        async () => {

          try{

            await api(
              '/rest/v1/rpc/update_public_profile_v1',
              {
                method:'POST',

                body:JSON.stringify({

                  p_display_name:
                    $(
                      'caProfileNameInput'
                    ).value,

                  p_bio:
                    $(
                      'caProfileBioInput'
                    ).value,

                  p_favorite_sports:
                    caCsvArray(
                      $(
                        'caProfileSportsInput'
                      ).value
                    ),

                  p_favorite_teams:
                    caCsvArray(
                      $(
                        'caProfileTeamsInput'
                      ).value
                    ),

                  p_favorite_players:
                    caCsvArray(
                      $(
                        'caProfilePlayersInput'
                      ).value
                    )

                })
              }
            );


            await caLoadMe();


            await caLoadPublicProfile(
              uid()
            );


            closeSheet();


            caRenderProfile();

          }catch(e){

            alert(
              e?.message ||
              'Could not save profile.'
            );

          }

        };

  }


  /* ==========================================================
     SIGNATURE CARD CHOOSER
     ========================================================== */

  function caOpenSignatureChooser(){

    const choices =
      (S.h || [])
        .filter(
          h =>
            Number(
              h.quantity ||
              0
            ) > 0 &&
            h.cards
              ?.image_url
        );


    $('sheet').innerHTML = `
      <button
        class="backbtn"
        onclick="closeSheet()"
      >
        ← Back
      </button>


      <div
        class="muted"
      >
        SIGNATURE CARD
      </div>


      <h2>
        Choose your profile card
      </h2>


      <div
        class="muted"
        style="
          font-size:11px;
          line-height:1.45;
        "
      >
        Your signature card must be
        an active card you currently own.
        Selling your final copy removes it
        from your profile automatically.
      </div>


      <div
        class="caAvatarGrid"
      >

        ${
          choices.length
            ? choices
                .map(
                  h => `
                    <button
                      class="caAvatarChoice"
                      data-ca-avatar="${
                        caEsc(
                          h.cards.id
                        )
                      }"
                    >

                      <img
                        src="${
                          caEsc(
                            h.cards
                              .image_url
                          )
                        }"
                        alt="Card"
                      >


                      <div>
                        ${
                          caEsc(
                            h.cards
                              .player_name ||
                            'Card'
                          )
                        }

                        <br>

                        <span
                          class="muted"
                        >
                          ${
                            caEsc(
                              [
                                h.cards
                                  .year,

                                h.cards
                                  .parallel
                              ]
                                .filter(
                                  Boolean
                                )
                                .join(
                                  ' · '
                                )
                            )
                          }
                        </span>
                      </div>

                    </button>
                  `
                )
                .join('')
            : `
              <div
                class="muted"
                style="
                  grid-column:1/-1;
                  font-size:11px;
                "
              >
                No active cards with an approved image are available.
              </div>
            `
        }

      </div>
    `;


    openSheet();


    document
      .querySelectorAll(
        '[data-ca-avatar]'
      )
      .forEach(
        btn => {

          btn.onclick =
            async () => {

              try{

                await api(
                  '/rest/v1/rpc/set_profile_avatar_card_v1',
                  {
                    method:'POST',

                    body:JSON.stringify({
                      p_card_id:
                        btn.dataset
                          .caAvatar
                    })
                  }
                );


                await caLoadMe();


                await caLoadPublicProfile(
                  uid()
                );


                closeSheet();


                caRenderProfile();

              }catch(e){

                alert(
                  e?.message ||
                  'Could not set signature card.'
                );

              }

            };

        }
      );

  }


  /* ==========================================================
     END CHUNK 2
     Continue immediately with Chunk 3.
     ========================================================== */
 /* ==========================================================
     SETTINGS DRAWER
     ========================================================== */

  let caDrawerBg =
    document.getElementById(
      'caDrawerBg'
    );


  if(!caDrawerBg){

    caDrawerBg =
      document.createElement(
        'div'
      );


    caDrawerBg.id =
      'caDrawerBg';


    caDrawerBg.className =
      'caDrawerBg';


    caDrawerBg.innerHTML = `
      <aside
        class="caDrawer"
      >

        <div
          class="caDrawerHeader"
        >

          <b>
            Settings
          </b>


          <button
            id="caDrawerClose"
            class="caDrawerClose"
          >
            ×
          </button>

        </div>


        <button
          id="caDrawerProfile"
          class="caDrawerProfile"
        >

          <div
            id="caDrawerAvatar"
            class="caDrawerAvatar"
          >
            CA
          </div>


          <div>

            <div
              id="caDrawerProfileName"
              class="caDrawerProfileName"
            >
              Profile
            </div>


            <div
              class="caDrawerProfileSub"
            >
              Public collector profile
            </div>

          </div>


          <div
            class="caDrawerArrow"
          >
            ›
          </div>

        </button>


        <div
          class="caDrawerLabel"
        >
          Flipping
        </div>


        <button
          id="caFlipPreferences"
          class="caDrawerItem"
        >
          Flip preferences
          <span>›</span>
        </button>


        <button
          id="caNotificationPreferences"
          class="caDrawerItem"
        >
          Notifications
          <span>›</span>
        </button>


        <div
          class="caDrawerLabel"
        >
          Account
        </div>


        <button
          id="caPasscodeSettings"
          class="caDrawerItem"
        >
          Private passcode
          <span>›</span>
        </button>


        <button
          id="caEbaySettings"
          class="caDrawerItem"
        >
          eBay connection
          <span>›</span>
        </button>


        <div
          class="caDrawerLabel"
        >
          Private research
        </div>


        <button
          id="caPrivateResearch"
          class="
            caDrawerItem
            private
          "
        >
          Goose & Watchlist
          <span>🔒</span>
        </button>


        <div
          class="caDrawerLabel"
        >
          Advanced
        </div>


        <button
          id="caDataStatus"
          class="caDrawerItem"
        >
          Data & sync status
          <span>›</span>
        </button>

      </aside>
    `;


    document.body.appendChild(
      caDrawerBg
    );

  }


  function caOpenDrawer(){

    caDrawerBg.classList.add(
      'open'
    );

  }


  function caCloseDrawer(){

    caDrawerBg.classList.remove(
      'open'
    );

  }


  function caRenderDrawerProfile(){

    const avatar =
      document.getElementById(
        'caDrawerAvatar'
      );


    const name =
      document.getElementById(
        'caDrawerProfileName'
      );


    if(name){

      name.textContent =
        CA.me?.display_name ||
        'Profile';

    }


    if(avatar){

      if(
        CA.me
          ?.avatar_image_url
      ){

        avatar.innerHTML = `
          <img
            src="${
              caEsc(
                CA.me
                  .avatar_image_url
              )
            }"
            alt="Profile card"
          >
        `;

      }else{

        avatar.textContent =
          'CA';

      }

    }

  }


  document
    .getElementById(
      'caSettingsTopButton'
    )
    .onclick =
      caOpenDrawer;


  document
    .getElementById(
      'caDrawerClose'
    )
    .onclick =
      caCloseDrawer;


  caDrawerBg.onclick =
    e => {

      if(
        e.target ===
        caDrawerBg
      ){

        caCloseDrawer();

      }

    };


  document
    .getElementById(
      'caDrawerProfile'
    )
    .onclick =
      async () => {

        caCloseDrawer();

        await caOpenProfile(
          uid()
        );

      };

/* ==========================================================
     SECURE PASSCODE UI
     ========================================================== */

  const caSecureStyle =
    document.createElement('style');

  caSecureStyle.textContent = `
    .caSecureBg{
      position:fixed;
      inset:0;
      z-index:999;
      background:rgba(5,8,9,.97);
      display:flex;
      align-items:center;
      justify-content:center;
      padding:
        calc(24px + env(safe-area-inset-top))
        22px
        calc(24px + env(safe-area-inset-bottom));
      opacity:0;
      pointer-events:none;
      transition:opacity .18s ease;
    }

    .caSecureBg.open{
      opacity:1;
      pointer-events:auto;
    }

    .caSecureCard{
      width:min(390px,100%);
      text-align:center;
      transform:translateY(8px) scale(.985);
      transition:transform .18s ease;
    }

    .caSecureBg.open .caSecureCard{
      transform:translateY(0) scale(1);
    }

    .caSecureIcon{
      width:58px;
      height:58px;
      margin:0 auto 20px;
      border-radius:18px;
      border:1px solid #314038;
      background:#131a17;
      display:flex;
      align-items:center;
      justify-content:center;
      font-size:25px;
    }

    .caSecureEyebrow{
      color:#74807a;
      font-size:9px;
      font-weight:950;
      letter-spacing:1.15px;
      text-transform:uppercase;
    }

    .caSecureTitle{
      margin-top:7px;
      font-size:29px;
      font-weight:950;
      letter-spacing:-.8px;
    }

    .caSecureCopy{
      margin:8px auto 22px;
      max-width:300px;
      color:#87928d;
      font-size:11px;
      line-height:1.5;
    }

    .caCodeRow{
      display:grid;
      grid-template-columns:repeat(6,1fr);
      gap:8px;
      margin:0 auto;
    }

    .caCodeBox{
      height:58px;
      border-radius:13px;
      border:1px solid #2c363a;
      background:#0e1315;
      display:flex;
      align-items:center;
      justify-content:center;
      color:#f5faf7;
      font-size:24px;
      font-weight:950;
      transition:
        border-color .12s ease,
        background .12s ease,
        transform .12s ease;
    }

    .caCodeBox.active{
      border-color:#86dba4;
      background:#131b17;
    }

    .caCodeBox.filled{
      border-color:#35433c;
    }

    .caSecureInput{
      position:absolute;
      opacity:0;
      pointer-events:none;
      width:1px;
      height:1px;
    }

    .caSecureError{
      min-height:20px;
      margin-top:13px;
      color:#ff9ca5;
      font-size:10px;
      font-weight:800;
    }

    .caSecureActions{
      display:grid;
      grid-template-columns:1fr;
      gap:8px;
      margin-top:8px;
    }

    .caSecureVerify{
      border:0;
      border-radius:13px;
      padding:14px;
      background:#edf8f0;
      color:#07120a;
      font-weight:950;
      font-size:12px;
    }

    .caSecureVerify:disabled{
      opacity:.4;
    }

    .caSecureCancel{
      border:0;
      background:none;
      color:#77827d;
      padding:10px;
      font-size:10px;
      font-weight:850;
    }

    .caSecureDots{
      margin-top:17px;
      color:#56615c;
      font-size:8px;
      letter-spacing:.5px;
      text-transform:uppercase;
    }

    @keyframes caSecureShake{
      0%,100%{transform:translateX(0)}
      20%{transform:translateX(-7px)}
      40%{transform:translateX(7px)}
      60%{transform:translateX(-5px)}
      80%{transform:translateX(5px)}
    }

    .caSecureShake{
      animation:caSecureShake .32s ease;
    }
  `;

  document.head.appendChild(
    caSecureStyle
  );


  function caPasscodeScreen({
    title = 'Enter Passcode',
    copy = 'Enter your six-digit private access code.',
    confirmLabel = 'Verify',
    allowCancel = true
  } = {}){

    return new Promise(resolve => {

      const bg =
        document.createElement('div');

      bg.className =
        'caSecureBg';

      bg.innerHTML = `
        <div class="caSecureCard">

          <div class="caSecureIcon">
            ◉
          </div>

          <div class="caSecureEyebrow">
            Card Analyst
          </div>

          <div class="caSecureTitle">
            ${caEsc(title)}
          </div>

          <div class="caSecureCopy">
            ${caEsc(copy)}
          </div>

          <input
            class="caSecureInput"
            inputmode="numeric"
            autocomplete="one-time-code"
            maxlength="6"
            pattern="[0-9]*"
            aria-label="Six digit passcode"
          >

          <div class="caCodeRow">
            ${Array.from({length:6},(_,i)=>`
              <div
                class="caCodeBox"
                data-code-box="${i}"
              ></div>
            `).join('')}
          </div>

          <div class="caSecureError"></div>

          <div class="caSecureActions">

            <button
              class="caSecureVerify"
              disabled
            >
              ${caEsc(confirmLabel)}
            </button>

            ${
              allowCancel
                ? `
                  <button
                    class="caSecureCancel"
                  >
                    Cancel
                  </button>
                `
                : ''
            }

          </div>

          <div class="caSecureDots">
            Private access · encrypted verification
          </div>

        </div>
      `;

      document.body.appendChild(
        bg
      );

      const card =
        bg.querySelector(
          '.caSecureCard'
        );

      const input =
        bg.querySelector(
          '.caSecureInput'
        );

      const verify =
        bg.querySelector(
          '.caSecureVerify'
        );

      const cancel =
        bg.querySelector(
          '.caSecureCancel'
        );

      const error =
        bg.querySelector(
          '.caSecureError'
        );

      const boxes =
        [...bg.querySelectorAll(
          '.caCodeBox'
        )];

      let finished =
        false;

      function cleanup(value){

        if(finished){
          return;
        }

        finished = true;

        bg.classList.remove(
          'open'
        );

        setTimeout(
          () => bg.remove(),
          180
        );

        resolve(value);
      }


      function renderCode(){

        const value =
          input.value
            .replace(/\D/g,'')
            .slice(0,6);

        input.value =
          value;

        boxes.forEach(
          (box,index) => {

            const filled =
              index < value.length;

            box.textContent =
              filled
                ? '•'
                : '';

            box.classList.toggle(
              'filled',
              filled
            );

            box.classList.toggle(
              'active',
              index ===
                Math.min(
                  value.length,
                  5
                ) &&
              value.length < 6
            );

          }
        );

        verify.disabled =
          value.length !== 6;

        error.textContent =
          '';

        if(value.length === 6){

          setTimeout(
            () => verify.focus(),
            60
          );

        }

      }


      function shake(
        message = 'Incorrect passcode'
      ){

        error.textContent =
          message;

        card.classList.remove(
          'caSecureShake'
        );

        void card.offsetWidth;

        card.classList.add(
          'caSecureShake'
        );

        input.value = '';

        renderCode();

        setTimeout(
          () => input.focus(),
          120
        );

      }


      bg.caShake =
        shake;


      input.addEventListener(
        'input',
        renderCode
      );


      input.addEventListener(
        'keydown',
        e => {

          if(
            e.key === 'Enter' &&
            input.value.length === 6
          ){

            verify.click();

          }

        }
      );


      bg.addEventListener(
        'click',
        e => {

          if(
            !e.target.closest(
              '.caSecureVerify'
            ) &&
            !e.target.closest(
              '.caSecureCancel'
            )
          ){

            input.focus();

          }

        }
      );


      verify.onclick =
        () => {

          const code =
            input.value;

          if(code.length !== 6){
            return;
          }

          cleanup({
            code,
            overlay:bg
          });

        };


      if(cancel){

        cancel.onclick =
          () => cleanup(null);

      }


      requestAnimationFrame(
        () => {

          bg.classList.add(
            'open'
          );

          setTimeout(
            () => input.focus(),
            120
          );

        }
      );

      renderCode();

    });

  }


  async function caSecureVerifyPasscode(
    feature
  ){

    const result =
      await caPasscodeScreen({

        title:'Secure Access',

        copy:
          feature === 'flips'
            ? 'Enter your six-digit passcode to unlock Flips.'
            : 'Enter your six-digit passcode to unlock private research.',

        confirmLabel:'Unlock'

      });


    if(!result){
      return false;
    }


    try{

      const verified =
        await api(
          '/rest/v1/rpc/verify_feature_passcode_v1',
          {
            method:'POST',

            body:JSON.stringify({
              p_passcode:
                result.code,

              p_feature:
                feature
            })
          }
        );


      if(
        !verified?.ok
      ){

        alert(
          'Incorrect passcode.'
        );

        return false;
      }


      return true;


    }catch(e){

      alert(
        e?.message ||
        'Could not verify passcode.'
      );

      return false;

    }

  }

  /* ==========================================================
     PASSCODE
     ========================================================== */

  async function caCreatePasscode(){

    const first =
      await caPasscodeScreen({
        title:'Create Passcode',
        copy:'Choose a six-digit code for your private Card Analyst features.',
        confirmLabel:'Continue'
      });


    if(!first){
      return false;
    }


    const second =
      await caPasscodeScreen({
        title:'Confirm Passcode',
        copy:'Enter the same six-digit code one more time.',
        confirmLabel:'Save Passcode'
      });


    if(!second){
      return false;
    }


    if(
      first.code !==
      second.code
    ){

      alert(
        'Passcodes did not match.'
      );

      return false;

    }


    try{

      await api(
        '/rest/v1/rpc/set_feature_passcode_v1',
        {
          method:'POST',

          body:JSON.stringify({
            p_passcode:
              first.code
          })
        }
      );


      caClearUnlocks();


      CA.lockState =
        await api(
          '/rest/v1/rpc/feature_lock_status_v1',
          {
            method:'POST',
            body:JSON.stringify({})
          }
        );


      caRebuildBottomNav();


      return true;


    }catch(e){

      alert(
        e?.message ||
        'Could not save passcode.'
      );


      return false;

    }

  }


  async function caUnlockFeature(
    feature
  ){

    if(
      caUnlocked(
        feature
      )
    ){

      return true;

    }


    if(
      !CA.lockState
        ?.has_passcode
    ){

      const made =
        await caCreatePasscode();


      if(!made){

        return false;

      }

    }


    const ok =
      await caSecureVerifyPasscode(
        feature
      );


    if(!ok){

      return false;

    }


    caMarkUnlocked(
      feature
    );


    caRebuildBottomNav();


    return true;

  }


  document
    .getElementById(
      'caPasscodeSettings'
    )
    .onclick =
      async () => {

        caCloseDrawer();

        await caCreatePasscode();

      };


  /* ==========================================================
     RESEARCH HUB
     Goose + Watchlist together
     ========================================================== */

  function caEnsureResearchTabs(){

    [
      ['goose','Goose'],
      ['watchlist','Watchlist']
    ]
      .forEach(
        ([id]) => {

          const section =
            document.getElementById(
              id
            );


          const card =
            section
              ?.querySelector(
                '.card'
              );


          if(
            !card ||
            card.querySelector(
              '.caResearchTabs'
            )
          ){

            return;

          }


          const tabs =
            document.createElement(
              'div'
            );


          tabs.className =
            'caResearchTabs';


          tabs.innerHTML = `
            <button
              data-ca-research="goose"
              class="${
                id === 'goose'
                  ? 'active'
                  : ''
              }"
            >
              Goose
            </button>

            <button
              data-ca-research="watchlist"
              class="${
                id === 'watchlist'
                  ? 'active'
                  : ''
              }"
            >
              Watchlist
            </button>
          `;


          card.insertBefore(
            tabs,
            card.firstChild
          );


          tabs
            .querySelectorAll(
              '[data-ca-research]'
            )
            .forEach(
              btn => {

                btn.onclick =
                  async () => {

                    const ok =
                      await caUnlockFeature(
                        'goose'
                      );


                    if(!ok){
                      return;
                    }


                    view(
                      btn.dataset
                        .caResearch
                    );

                  };

              }
            );

        }
      );

  }


  document
    .getElementById(
      'caPrivateResearch'
    )
    .onclick =
      async () => {

        const ok =
          await caUnlockFeature(
            'goose'
          );


        if(!ok){
          return;
        }


        caCloseDrawer();


        caEnsureResearchTabs();


        view(
          'goose'
        );

      };


  /* ==========================================================
     SETTINGS PLACEHOLDERS
     ========================================================== */

  document
    .getElementById(
      'caFlipPreferences'
    )
    .onclick =
      () => {

        caCloseDrawer();


        alert(
          'Flip preferences are ready for the next settings pass: bankroll, minimum profit, minimum ROI, sports, sets, rarity preference, maximum buy price and new-release aggressiveness.'
        );

      };


  document
    .getElementById(
      'caNotificationPreferences'
    )
    .onclick =
      () => {

        caCloseDrawer();


        alert(
          'Notification settings will control Flips, Misidentified, rare-card alerts, minimum profit, minimum ROI and quiet hours.'
        );

      };


  document
    .getElementById(
      'caEbaySettings'
    )
    .onclick =
      () => {

        caCloseDrawer();


        view(
          'portfolio'
        );


        setTimeout(
          () => {

            document
              .getElementById(
                'ebayconnectcard'
              )
              ?.scrollIntoView({
                behavior:'smooth',
                block:'center'
              });

          },
          100
        );

      };


  document
    .getElementById(
      'caDataStatus'
    )
    .onclick =
      () => {

        caCloseDrawer();


        alert(
          'Advanced data status will show eBay discovery, Product Research, matcher health, push worker health and last successful sync.'
        );

      };


  /* ==========================================================
     MAIN SECTION HIDING
     ========================================================== */

  function caHideAllMainSections(){

    [
      'portfolio',
      'add',
      'goose',
      'watchlist',
      'flips',
      'caProfilePage'
    ]
      .forEach(
        id => {

          document
            .getElementById(
              id
            )
            ?.classList.add(
              'hidden'
            );

        }
      );

  }


  /* ==========================================================
     VIEW WRAPPER
     ========================================================== */

  const caBaseView =
    view;


  view =
    function(v){

      if(
        v === 'caProfilePage'
      ){

        return;

      }


      caProfileSection
        ?.classList.add(
          'hidden'
        );


      if(
        v === 'goose' ||
        v === 'watchlist'
      ){

        caSetWide(
          true
        );


        caEnsureResearchTabs();

      }else if(
        v === 'flips'
      ){

        caSetWide(
          true
        );

      }else{

        caSetWide(
          false
        );

      }


      return caBaseView(
        v
      );

    };


  /* ==========================================================
     BOTTOM NAV REBUILD
     Portfolio | Add | Flips
     ========================================================== */

  function caRebuildBottomNav(){

    const nav =
      document.getElementById(
        'nav'
      );


    if(!nav){
      return;
    }


    nav
      .querySelectorAll(
        '[data-v="goose"],' +
        '[data-v="watchlist"]'
      )
      .forEach(
        el => el.remove()
      );


    const portfolio =
      nav.querySelector(
        '[data-v="portfolio"]'
      );


    const add =
      nav.querySelector(
        '[data-v="add"]'
      );


    const flips =
      document.getElementById(
        'flipnav'
      );


    if(portfolio){

      nav.appendChild(
        portfolio
      );

    }


    if(add){

      nav.appendChild(
        add
      );

    }


    if(flips){

      nav.appendChild(
        flips
      );


      flips.innerHTML =
        caUnlocked(
          'flips'
        )
          ? `
            <span
              class="navico"
            >
              ↗
            </span>
            Flips
          `
          : `
            <span
              class="navico"
            >
              ↗
            </span>
            Flips 🔒
          `;


      flips.onclick =
        async () => {

          const ok =
            await caUnlockFeature(
              'flips'
            );


          if(!ok){
            return;
          }


          caRebuildBottomNav();


          view(
            'flips'
          );

        };

    }


    nav.style
      .gridTemplateColumns =
        'repeat(3,1fr)';

  }


  /*
    flips.js creates #flipnav after dashboard.js.
  */

  setTimeout(
    caRebuildBottomNav,
    150
  );


  setTimeout(
    caRebuildBottomNav,
    800
  );


  /* ==========================================================
     END CHUNK 3
     Continue immediately with Chunk 4.
     ========================================================== */
/* ==========================================================
     SHOWROOM LABEL / CLEANUP
     ========================================================== */

  function caPolishPortfolio(){

    const title =
      document.querySelector(
        '#portfolio .trophytitle h2'
      );


    if(title){

      title.textContent =
        'Showroom';

    }


    /*
      Keep the compact lower holdings list,
      but give it a clean heading.
    */

    const list =
      document.getElementById(
        'trophylist'
      );


    if(
      list &&
      !document.getElementById(
        'caAllHoldingsTitle'
      )
    ){

      const head =
        document.createElement(
          'div'
        );


      head.id =
        'caAllHoldingsTitle';


      head.innerHTML = `
        <div
          style="
            margin-top:10px;
            padding-top:18px;
            border-top:1px solid #20282c;
          "
        >

          <div
            style="
              font-size:16px;
              font-weight:900;
              letter-spacing:-.25px;
            "
          >
            All Holdings
          </div>

          <div
            style="
              margin-top:3px;
              color:#78837e;
              font-size:9px;
            "
          >
            Your complete active collection
          </div>

        </div>
      `;


      list.parentNode.insertBefore(
        head,
        list
      );

    }

  }


  /* ==========================================================
     IMAGE MODERATOR
     Only the designated moderator sees Change picture.
     ========================================================== */

  async function caGetImageCandidate(
    cardId
  ){

    const rows =
      await api(
        '/rest/v1/rpc/portfolio_image_candidate_v2',
        {
          method:'POST',

          body:JSON.stringify({
            p_card_id:cardId
          })
        }
      );


    return Array.isArray(rows)
      ? rows[0] || null
      : null;

  }


  async function caApproveImage(
    candidate
  ){

    return await api(
      '/rest/v1/rpc/approve_catalog_card_image_v2',
      {
        method:'POST',

        body:JSON.stringify({

          p_catalog_id:
            candidate.catalog_id,

          p_image_url:
            candidate.candidate_image_url,

          p_source_item_id:
            candidate.source_item_id

        })
      }
    );

  }


  async function caRejectImage(
    candidate
  ){

    return await api(
      '/rest/v1/rpc/reject_catalog_card_image_v1',
      {
        method:'POST',

        body:JSON.stringify({

          p_catalog_id:
            candidate.catalog_id,

          p_image_url:
            candidate.candidate_image_url,

          p_source_item_id:
            candidate.source_item_id

        })
      }
    );

  }


  function caCandidateIdentity(
    candidate
  ){

    return [
      candidate.year,

      candidate.player_name,

      candidate.set_name,

      candidate.card_number
        ? '#' +
          candidate.card_number
        : null,

      candidate.parallel

    ]
      .filter(Boolean)
      .join(' · ');

  }


  function caRemoveImageReview(){

    document
      .querySelectorAll(
        '.caImageReview'
      )
      .forEach(
        el => el.remove()
      );

  }


  async function caOpenImageReview(
    cardId,
    holdingIndex
  ){

    caRemoveImageReview();


    let candidate;


    try{

      candidate =
        await caGetImageCandidate(
          cardId
        );

    }catch(e){

      alert(
        e?.message ||
        'Could not load another image candidate.'
      );

      return;

    }


    if(
      !candidate ||
      !candidate
        .candidate_image_url
    ){

      alert(
        'No additional exact-match image candidates are available right now.'
      );

      return;

    }


    const review =
      document.createElement(
        'div'
      );


    review.className =
      'caImageReview';


    review.innerHTML = `
      <img
        src="${
          caEsc(
            candidate
              .candidate_image_url
          )
        }"
        alt="Candidate image"
      >


      <div
        class="caImageReviewTitle"
      >
        Is this the correct card?
      </div>


      <div
        class="caImageReviewMeta"
      >
        ${
          caEsc(
            caCandidateIdentity(
              candidate
            )
          )
        }
      </div>


      <div
        class="caImageReviewActions"
      >

        <button
          class="caImageYes"
        >
          Use this image
        </button>


        <button
          class="caImageNo"
        >
          Wrong image
        </button>

      </div>
    `;


    const changeButton =
      document.getElementById(
        'caChangeImageButton'
      );


    if(changeButton){

      changeButton.before(
        review
      );

    }else{

      $('sheet').appendChild(
        review
      );

    }


    review
      .querySelector(
        '.caImageYes'
      )
      .onclick =
        async e => {

          const button =
            e.currentTarget;


          button.disabled =
            true;


          button.textContent =
            'Saving…';


          try{

            await caApproveImage(
              candidate
            );


            caRemoveImageReview();


            /*
              Reload holdings so the newly
              approved canonical image appears
              immediately.
            */

            await load();


            await caLoadMe();


            closeSheet();


            setTimeout(
              () => {

                openTrophyInvestment(
                  holdingIndex
                );

              },
              100
            );

          }catch(err){

            button.disabled =
              false;


            button.textContent =
              'Use this image';


            alert(
              err?.message ||
              'Could not approve this image.'
            );

          }

        };


    review
      .querySelector(
        '.caImageNo'
      )
      .onclick =
        async e => {

          const button =
            e.currentTarget;


          button.disabled =
            true;


          button.textContent =
            'Finding another…';


          try{

            await caRejectImage(
              candidate
            );


            caRemoveImageReview();


            /*
              Immediately show the next
              candidate instead of closing
              the card.
            */

            await caOpenImageReview(
              cardId,
              holdingIndex
            );

          }catch(err){

            button.disabled =
              false;


            button.textContent =
              'Wrong image';


            alert(
              err?.message ||
              'Could not reject this image.'
            );

          }

        };

  }


  /* ==========================================================
     HOLDING DETAIL WRAPPER
     ========================================================== */

  const caOriginalOpenTrophy =
    typeof openTrophyInvestment ===
      'function'
      ? openTrophyInvestment
      : null;


  if(caOriginalOpenTrophy){

    openTrophyInvestment =
      async function(i){

        /*
          Load the normal investment /
          holding detail first.
        */

        const result =
          await caOriginalOpenTrophy(
            i
          );


        /*
          Remove any obsolete image review
          controls that might have survived
          in browser cache.
        */

        document
          .querySelectorAll(
            '.imgreview,' +
            '.caImageReview'
          )
          .forEach(
            el => el.remove()
          );


        /*
          Nobody except the image moderator
          sees approval/rejection controls.
        */

        if(
          !CA.imageModerator
        ){

          return result;

        }


        const holding =
          S.h?.[i];


        const card =
          holding?.cards;


        if(
          !card?.id
        ){

          return result;

        }


        let button =
          document.getElementById(
            'caChangeImageButton'
          );


        if(!button){

          button =
            document.createElement(
              'button'
            );


          button.id =
            'caChangeImageButton';


          button.className =
            'caChangeImage';


          button.textContent =
            'Change picture';


          $('sheet').appendChild(
            button
          );

        }


        button.onclick =
          async () => {

            await caOpenImageReview(
              card.id,
              i
            );

          };


        return result;

      };

  }


  /* ==========================================================
     OWN SHOWROOM CARD CLICK BEHAVIOR
     ========================================================== */

  function caWireShowroomCards(){

    document
      .querySelectorAll(
        '#holdings .trophycard'
      )
      .forEach(
        (card,index) => {

          card.onclick =
            () =>
              openTrophyInvestment(
                index
              );

        }
      );

  }


  /*
    render() belongs to the original app shell.
    Wrap it so every portfolio refresh also
    gets the new Showroom presentation.
  */

  const caOriginalRender =
    typeof render ===
      'function'
      ? render
      : null;


  if(caOriginalRender){

    render =
      function(){

        const result =
          caOriginalRender();


        requestAnimationFrame(
          () => {

            caPolishPortfolio();

            caWireShowroomCards();

          }
        );


        return result;

      };

  }


  /*
    Apply immediately in case holdings were
    already rendered before dashboard.js loaded.
  */

  requestAnimationFrame(
    () => {

      caPolishPortfolio();

      caWireShowroomCards();

    }
  );


  /* ==========================================================
     PUBLIC SHOWROOM CARD DETAILS
     Read-only when viewing another collector.
     ========================================================== */

  function caOpenPublicCard(
    card
  ){

    $('sheet').innerHTML = `
      <button
        class="backbtn"
        onclick="closeSheet()"
      >
        ← Back
      </button>


      <div
        class="muted"
      >
        SHOWROOM
      </div>


      ${
        card.image_url
          ? `
            <div
              style="
                margin-top:12px;
                height:390px;
                padding:10px;
                border-radius:18px;
                border:1px solid #293338;
                background:#080b0d;
                display:flex;
                align-items:center;
                justify-content:center;
              "
            >

              <img
                src="${
                  caEsc(
                    card.image_url
                  )
                }"
                alt="Card"
                style="
                  width:100%;
                  height:100%;
                  object-fit:contain;
                "
              >

            </div>
          `
          : ''
      }


      <h2
        style="
          margin-top:15px;
        "
      >
        ${
          caEsc(
            card.player_name ||
            card.display_name ||
            'Card'
          )
        }
      </h2>


      <div
        class="context"
      >

        <div
          class="grid"
          style="
            margin-top:0;
            margin-bottom:0;
          "
        >

          <div
            class="stat"
          >
            <small>
              Current value
            </small>

            <b>
              ${
                caMoney(
                  card.market_value
                )
              }
            </b>
          </div>


          <div
            class="stat"
          >
            <small>
              Quantity
            </small>

            <b>
              ${
                Number(
                  card.quantity ||
                  1
                )
              }
            </b>
          </div>

        </div>


        <div
          class="muted"
          style="
            margin-top:10px;
            font-size:10px;
            line-height:1.45;
          "
        >
          ${
            caEsc(
              [
                card.year,
                card.set_name,
                card.card_number
                  ? '#' +
                    card.card_number
                  : null,
                card.parallel,
                card.serial_numbered_to
                  ? '/' +
                    card.serial_numbered_to
                  : null
              ]
                .filter(Boolean)
                .join(' · ')
            )
          }
        </div>

      </div>
    `;


    openSheet();

  }


  function caWirePublicShowroom(){

    document
      .querySelectorAll(
        '[data-ca-public-card]'
      )
      .forEach(
        btn => {

          btn.onclick =
            () => {

              const index =
                Number(
                  btn.dataset
                    .caPublicCard
                );


              const card =
                CA.viewingShowroom[
                  index
                ];


              if(card){

                caOpenPublicCard(
                  card
                );

              }

            };

        }
      );

  }


  /* ==========================================================
     END CHUNK 4
     Continue immediately with Chunk 5.
     ========================================================== */
/* ==========================================================
     PATCH PUBLIC SHOWROOM CARDS TO BE TAPPABLE
     ========================================================== */

  function caPublicShowroomHtml(){

    if(
      !CA.viewingShowroom.length
    ){

      return `
        <div
          class="muted"
          style="
            font-size:11px;
            padding:15px 0;
          "
        >
          No active cards in this Showroom.
        </div>
      `;

    }


    return CA.viewingShowroom
      .map(
        (card,index) => `
          <button
            class="caPublicCard"
            data-ca-public-card="${index}"
            style="
              padding:0;
              border:0;
              background:none;
              color:#fff;
              text-align:left;
            "
          >

            <div
              class="caPublicCardImage"
            >

              ${
                card.image_url
                  ? `
                    <img
                      src="${
                        caEsc(
                          card.image_url
                        )
                      }"
                      alt="Card"
                    >
                  `
                  : `
                    <div
                      class="caSignatureEmpty"
                    >
                      Image pending
                    </div>
                  `
              }

            </div>


            <div
              class="caPublicCardName"
            >
              ${
                caEsc(
                  card.player_name ||
                  card.display_name ||
                  'Card'
                )
              }
            </div>


            <div
              class="caPublicCardMeta"
            >
              ${
                caEsc(
                  [
                    card.year,
                    card.set_name,
                    card.card_number
                      ? '#' +
                        card.card_number
                      : null,
                    card.parallel
                  ]
                    .filter(Boolean)
                    .join(' · ')
                )
              }
            </div>


            <div
              class="caPublicCardValue"
            >
              ${
                caMoney(
                  card.market_value
                )
              }
            </div>

          </button>
        `
      )
      .join('');

  }


  /* ==========================================================
     REWRAP PROFILE RENDER SO PUBLIC SHOWROOM GETS WIRED
     ========================================================== */

  const caOriginalRenderProfile =
    caRenderProfile;


  caRenderProfile =
    function(){

      caOriginalRenderProfile();


      requestAnimationFrame(
        () => {

          caWirePublicShowroom();

        }
      );

    };


  /* ==========================================================
     SETTINGS SHEET HELPERS
     ========================================================== */

  function caSettingsSheet(
    eyebrow,
    title,
    bodyHtml
  ){

    $('sheet').innerHTML = `
      <button
        class="backbtn"
        onclick="closeSheet()"
      >
        ← Back
      </button>


      <div class="muted">
        ${caEsc(eyebrow)}
      </div>


      <h2>
        ${caEsc(title)}
      </h2>


      ${bodyHtml}
    `;


    openSheet();

  }


  /* ==========================================================
     FLIP PREFERENCES
     Frontend-ready settings foundation
     ========================================================== */

  function caOpenFlipPreferences(){

    const existing =
      JSON.parse(
        localStorage.getItem(
          'ca_flip_preferences'
        ) || '{}'
      );


    caSettingsSheet(
      'FLIPPING',
      'Flip preferences',
      `
        <div class="card">

          <input
            id="caPrefBankroll"
            class="input"
            type="number"
            min="0"
            step="1"
            value="${
              existing.bankroll ??
              250
            }"
            placeholder="Available bankroll"
          >


          <input
            id="caPrefMinProfit"
            class="input"
            type="number"
            min="0"
            step="1"
            value="${
              existing.minProfit ??
              5
            }"
            placeholder="Minimum expected profit"
          >


          <input
            id="caPrefMinRoi"
            class="input"
            type="number"
            min="0"
            step="1"
            value="${
              existing.minRoi ??
              20
            }"
            placeholder="Minimum ROI %"
          >


          <input
            id="caPrefMaxBuy"
            class="input"
            type="number"
            min="0"
            step="1"
            value="${
              existing.maxBuy ??
              100
            }"
            placeholder="Maximum buy price"
          >


          <input
            id="caPrefSports"
            class="input"
            value="${
              caEsc(
                (
                  existing.sports ||
                  [
                    'basketball',
                    'football',
                    'baseball'
                  ]
                ).join(', ')
              )
            }"
            placeholder="Preferred sports"
          >


          <input
            id="caPrefSets"
            class="input"
            value="${
              caEsc(
                (
                  existing.sets ||
                  [
                    'Prizm',
                    'Topps Chrome',
                    'Optic',
                    'Select'
                  ]
                ).join(', ')
              )
            }"
            placeholder="Preferred sets"
          >


          <select
            id="caPrefRelease"
            class="input"
          >
            <option
              value="high"
              ${
                existing.releaseAggressiveness ===
                'high'
                  ? 'selected'
                  : ''
              }
            >
              Aggressive on new releases
            </option>

            <option
              value="balanced"
              ${
                !existing.releaseAggressiveness ||
                existing.releaseAggressiveness ===
                'balanced'
                  ? 'selected'
                  : ''
              }
            >
              Balanced
            </option>

            <option
              value="conservative"
              ${
                existing.releaseAggressiveness ===
                'conservative'
                  ? 'selected'
                  : ''
              }
            >
              Conservative
            </option>
          </select>


          <button
            id="caSaveFlipPreferences"
            class="btn primary"
          >
            Save preferences
          </button>

        </div>


        <div
          class="context"
        >
          <b>
            What this will control
          </b>

          <div
            class="muted"
            style="
              margin-top:5px;
              font-size:10px;
              line-height:1.45;
            "
          >
            These settings are the foundation for personalizing which
            opportunities Card Analyst prioritizes for your account.
          </div>
        </div>
      `
    );


    document
      .getElementById(
        'caSaveFlipPreferences'
      )
      .onclick =
        () => {

          const prefs = {

            bankroll:
              Number(
                $(
                  'caPrefBankroll'
                ).value ||
                0
              ),

            minProfit:
              Number(
                $(
                  'caPrefMinProfit'
                ).value ||
                0
              ),

            minRoi:
              Number(
                $(
                  'caPrefMinRoi'
                ).value ||
                0
              ),

            maxBuy:
              Number(
                $(
                  'caPrefMaxBuy'
                ).value ||
                0
              ),

            sports:
              caCsvArray(
                $(
                  'caPrefSports'
                ).value
              ),

            sets:
              caCsvArray(
                $(
                  'caPrefSets'
                ).value
              ),

            releaseAggressiveness:
              $(
                'caPrefRelease'
              ).value

          };


          localStorage.setItem(
            'ca_flip_preferences',
            JSON.stringify(
              prefs
            )
          );


          closeSheet();

        };

  }


  document
    .getElementById(
      'caFlipPreferences'
    )
    .onclick =
      () => {

        caCloseDrawer();

        caOpenFlipPreferences();

      };


  /* ==========================================================
     NOTIFICATION SETTINGS
     ========================================================== */

  function caOpenNotificationSettings(){

    const existing =
      JSON.parse(
        localStorage.getItem(
          'ca_notification_preferences'
        ) || '{}'
      );


    caSettingsSheet(
      'ALERTS',
      'Notifications',
      `
        <div class="card">

          <label
            style="
              display:flex;
              justify-content:space-between;
              align-items:center;
              padding:10px 0;
            "
          >
            <div>
              <b>
                Flip alerts
              </b>

              <div
                class="muted"
                style="
                  margin-top:3px;
                  font-size:9px;
                "
              >
                Actionable eBay opportunities
              </div>
            </div>

            <input
              id="caNotifFlips"
              type="checkbox"
              ${
                existing.flips !== false
                  ? 'checked'
                  : ''
              }
            >
          </label>


          <label
            style="
              display:flex;
              justify-content:space-between;
              align-items:center;
              padding:10px 0;
              border-top:1px solid #22292d;
            "
          >
            <div>
              <b>
                Misidentified alerts
              </b>

              <div
                class="muted"
                style="
                  margin-top:3px;
                  font-size:9px;
                "
              >
                Incorrectly listed parallels and rarity
              </div>
            </div>

            <input
              id="caNotifMisid"
              type="checkbox"
              ${
                existing.misidentified !== false
                  ? 'checked'
                  : ''
              }
            >
          </label>


          <label
            style="
              display:flex;
              justify-content:space-between;
              align-items:center;
              padding:10px 0;
              border-top:1px solid #22292d;
            "
          >
            <div>
              <b>
                Rare-card alerts
              </b>

              <div
                class="muted"
                style="
                  margin-top:3px;
                  font-size:9px;
                "
              >
                Numbered and scarce opportunities
              </div>
            </div>

            <input
              id="caNotifRare"
              type="checkbox"
              ${
                existing.rare !== false
                  ? 'checked'
                  : ''
              }
            >
          </label>


          <input
            id="caNotifMinProfit"
            class="input"
            type="number"
            min="0"
            step="1"
            value="${
              existing.minProfit ??
              5
            }"
            placeholder="Alert minimum profit"
          >


          <input
            id="caNotifMinRoi"
            class="input"
            type="number"
            min="0"
            step="1"
            value="${
              existing.minRoi ??
              20
            }"
            placeholder="Alert minimum ROI %"
          >


          <button
            id="caSaveNotificationSettings"
            class="btn primary"
          >
            Save notification settings
          </button>

        </div>
      `
    );


    document
      .getElementById(
        'caSaveNotificationSettings'
      )
      .onclick =
        () => {

          const prefs = {

            flips:
              $(
                'caNotifFlips'
              ).checked,

            misidentified:
              $(
                'caNotifMisid'
              ).checked,

            rare:
              $(
                'caNotifRare'
              ).checked,

            minProfit:
              Number(
                $(
                  'caNotifMinProfit'
                ).value ||
                0
              ),

            minRoi:
              Number(
                $(
                  'caNotifMinRoi'
                ).value ||
                0
              )

          };


          localStorage.setItem(
            'ca_notification_preferences',
            JSON.stringify(
              prefs
            )
          );


          closeSheet();

        };

  }


  document
    .getElementById(
      'caNotificationPreferences'
    )
    .onclick =
      () => {

        caCloseDrawer();

        caOpenNotificationSettings();

      };


  /* ==========================================================
     EBAY SETTINGS
     ========================================================== */

  document
    .getElementById(
      'caEbaySettings'
    )
    .onclick =
      async () => {

        caCloseDrawer();


        view(
          'portfolio'
        );


        setTimeout(
          () => {

            const card =
              document.getElementById(
                'ebayconnectcard'
              );


            if(card){

              card.scrollIntoView({
                behavior:'smooth',
                block:'center'
              });

            }

          },
          120
        );

      };


  /* ==========================================================
     DATA STATUS
     ========================================================== */

  function caOpenDataStatus(){

    caSettingsSheet(
      'ADVANCED',
      'Data & sync status',
      `
        <div class="card">

          <div
            class="row"
          >
            <div>
              <b>
                Portfolio
              </b>

              <span>
                ${
                  Number(
                    S.h?.length ||
                    0
                  )
                }
                holdings loaded
              </span>
            </div>

            <div
              class="right good"
            >
              LIVE
            </div>
          </div>


          <div
            class="row"
          >
            <div>
              <b>
                Price quotes
              </b>

              <span>
                ${
                  Number(
                    S.q?.length ||
                    0
                  )
                }
                current quotes
              </span>
            </div>

            <div
              class="right good"
            >
              LIVE
            </div>
          </div>


          <div
            class="row"
          >
            <div>
              <b>
                Public profile
              </b>

              <span>
                ${
                  CA.me
                    ? 'Loaded'
                    : 'Unavailable'
                }
              </span>
            </div>

            <div
              class="
                right
                ${
                  CA.me
                    ? 'good'
                    : 'warn'
                }
              "
            >
              ${
                CA.me
                  ? 'READY'
                  : 'CHECK'
              }
            </div>
          </div>


          <div
            class="row"
          >
            <div>
              <b>
                Image moderation
              </b>

              <span>
                Shared catalog image permissions
              </span>
            </div>

            <div
              class="right"
            >
              ${
                CA.imageModerator
                  ? 'MODERATOR'
                  : 'VIEW ONLY'
              }
            </div>
          </div>


          <div
            class="row"
          >
            <div>
              <b>
                Build
              </b>

              <span>
                Current dashboard shell
              </span>
            </div>

            <div
              class="right"
            >
              ${CA_BUILD}
            </div>
          </div>

        </div>


        <div
          class="context"
        >
          <b>
            Backend collectors
          </b>

          <div
            class="muted"
            style="
              margin-top:5px;
              font-size:10px;
              line-height:1.45;
            "
          >
            eBay discovery, Product Research, matcher and push-worker
            diagnostics can be added here without changing the main
            navigation.
          </div>
        </div>
      `
    );

  }


  document
    .getElementById(
      'caDataStatus'
    )
    .onclick =
      () => {

        caCloseDrawer();

        caOpenDataStatus();

      };


  /* ==========================================================
     PRIVATE RESEARCH BUTTON STATE
     ========================================================== */

  function caRefreshPrivateResearchButton(){

    const btn =
      document.getElementById(
        'caPrivateResearch'
      );


    if(!btn){
      return;
    }


    btn.innerHTML =
      caUnlocked(
        'goose'
      )
        ? `
          Goose & Watchlist
          <span>›</span>
        `
        : `
          Goose & Watchlist
          <span>🔒</span>
        `;

  }


  /* ==========================================================
     REFRESH NAV + SETTINGS AFTER UNLOCK
     ========================================================== */

  const caOriginalRebuildBottomNav =
    caRebuildBottomNav;


  caRebuildBottomNav =
    function(){

      caOriginalRebuildBottomNav();

      caRefreshPrivateResearchButton();

  };


  /* ==========================================================
     END CHUNK 5
     Continue immediately with Chunk 6.
     ========================================================== */
/* ==========================================================
     FINAL BACKEND CONTRACT NORMALIZATION
     Keeps earlier chunks clean without requiring edits.
     ========================================================== */

  function caNormalizeProfile(
    profile
  ){

    if(!profile){
      return null;
    }


    return {
      ...profile,

      user_id:
        profile.user_id ||
        profile.id ||
        null,

      created_at:
        profile.created_at ||
        profile.member_since ||
        null
    };

  }


  function caNormalizeShowroom(
    rows
  ){

    return (
      Array.isArray(rows)
        ? rows
        : []
    )
      .map(
        card => ({
          ...card,

          market_value:
            card.market_value ??
            card.market_value_per_unit ??
            null
        })
      );

  }


  const caRawLoadMe =
    caLoadMe;


  caLoadMe =
    async function(){

      await caRawLoadMe();


      CA.me =
        caNormalizeProfile(
          CA.me
        );


      caRenderTopButtons();

      caRenderDrawerProfile();

  };


  const caRawLoadPublicProfile =
    caLoadPublicProfile;


  caLoadPublicProfile =
    async function(
      userId
    ){

      await caRawLoadPublicProfile(
        userId
      );


      CA.viewingProfile =
        caNormalizeProfile(
          CA.viewingProfile
        );


      CA.viewingShowroom =
        caNormalizeShowroom(
          CA.viewingShowroom
        );

  };


  /* ==========================================================
     FINAL SIGNATURE CHOOSER POLISH
     ========================================================== */

  const caFinalStyle =
    document.createElement(
      'style'
    );


  caFinalStyle.textContent = `

    .caAvatarGrid{
      display:grid;

      grid-template-columns:
        repeat(2,minmax(0,1fr));

      gap:9px;

      margin-top:12px;
    }

    .caAvatarChoice{
      padding:0;

      border:
        1px solid #273136;

      border-radius:15px;

      overflow:hidden;

      background:#101518;

      color:#fff;

      text-align:left;
    }

    .caAvatarChoice img{
      width:100%;

      aspect-ratio:3/4;

      object-fit:contain;

      background:#080b0d;

      display:block;
    }

    .caAvatarChoice > div{
      padding:8px;

      font-size:10px;
      font-weight:850;

      line-height:1.35;
    }

    .caAvatarChoice:active{
      transform:
        scale(.985);
    }


    /* Premium card row polish */

    #trophylist{
      border-top:0!important;
    }

    #trophylist .trophylistrow{
      margin-top:7px;

      padding:12px!important;

      border:
        1px solid #222b30!important;

      border-radius:13px;

      background:#0d1113!important;
    }


    /* Profile page does not inherit
       awkward Portfolio spacing */

    #caProfilePage{
      padding-top:2px;
    }


    /* Stronger signature-card presence */

    .caSignatureCard{
      box-shadow:
        0
        16px
        45px
        rgba(0,0,0,.22);
    }


    /* Cleaner desktop profile */

    @media(min-width:700px){

      .caProfilePage{
        padding-top:12px;
      }

      .caProfileHero{
        padding-top:18px;
      }

      .caPublicShowroom{
        padding-bottom:18px;
      }

    }

  `;


  document.head.appendChild(
    caFinalStyle
  );


  /* ==========================================================
     SIGN OUT
     ========================================================== */

  function caInstallSignOut(){

    if(
      document.getElementById(
        'caSignOut'
      )
    ){
      return;
    }


    const ebayButton =
      document.getElementById(
        'caEbaySettings'
      );


    if(!ebayButton){
      return;
    }


    const button =
      document.createElement(
        'button'
      );


    button.id =
      'caSignOut';


    button.className =
      'caDrawerItem';


    button.innerHTML = `
      Sign out
      <span>›</span>
    `;


    ebayButton.after(
      button
    );


    button.onclick =
      () => {

        caCloseDrawer();


        if(
          !confirm(
            'Sign out of Card Analyst?'
          )
        ){
          return;
        }


        localStorage.removeItem(
          'cat'
        );


        localStorage.removeItem(
          'car'
        );


        caClearUnlocks();


        location.replace(
          location.pathname
        );

      };

  }


  /* ==========================================================
     TOP TOOL VISIBILITY
     ========================================================== */

  function caSyncTopTools(){

    const tools =
      document.getElementById(
        'caTopTools'
      );


    if(!tools){
      return;
    }


    const signedIn =
      !!T();


    tools.classList.toggle(
      'hidden',
      !signedIn
    );

  }


  /* ==========================================================
     FINAL PORTFOLIO LABELS
     ========================================================== */

  function caFinalPortfolioLabels(){

    const title =
      document.querySelector(
        '#portfolio .trophytitle h2'
      );


    if(title){

      title.textContent =
        'Showroom';

    }


    /*
      Update detail-page language too.
    */

    document
      .querySelectorAll(
        '#sheet .muted'
      )
      .forEach(
        el => {

          if(
            el.textContent
              ?.toUpperCase()
              .includes(
                'TROPHY ROOM'
              )
          ){

            el.textContent =
              el.textContent.replace(
                /TROPHY ROOM/gi,
                'SHOWROOM'
              );

          }

        }
      );

  }


  /* ==========================================================
     WRAP HOLDING DETAIL ONE FINAL TIME
     for Showroom terminology
     ========================================================== */

  const caFinalOpenTrophy =
    openTrophyInvestment;


  openTrophyInvestment =
    async function(i){

      const result =
        await caFinalOpenTrophy(
          i
        );


      caFinalPortfolioLabels();


      return result;

  };


  /* ==========================================================
     INITIAL APP BOOT
     ========================================================== */

  async function caInitialize(){

    if(
      CA.initialized
    ){
      return;
    }


    caSyncTopTools();


    /*
      Logged-out users only need the
      existing authentication screen.
    */

    if(
      !T()
    ){

      return;

    }


    CA.initialized =
      true;


    try{

      await caLoadMe();

    }catch(e){

      console.warn(
        'Card Analyst profile initialization failed',
        e
      );

    }


    caInstallSignOut();


    caEnsureResearchTabs();


    caPolishPortfolio();


    caWireShowroomCards();


    caRebuildBottomNav();


    caRefreshPrivateResearchButton();


    caFinalPortfolioLabels();


    caSyncTopTools();

  }


  /* ==========================================================
     HANDLE ASYNC ORIGINAL APP LOAD
     ========================================================== */

  /*
    The original inline app begins load()
    before dashboard.js is evaluated.

    This short retry window makes sure
    Showroom presentation is applied after
    holdings arrive, without using a
    MutationObserver.
  */

  let caBootAttempts =
    0;


  const caBootTimer =
    setInterval(
      () => {

        caBootAttempts++;


        if(
          T()
        ){

          caPolishPortfolio();

          caWireShowroomCards();

          caRebuildBottomNav();

          caFinalPortfolioLabels();

        }


        if(
          caBootAttempts >= 8
        ){

          clearInterval(
            caBootTimer
          );

        }

      },
      500
    );


  /* ==========================================================
     RETURN FROM BACKGROUND / HOME SCREEN
     ========================================================== */

  document
    .addEventListener(
      'visibilitychange',
      async () => {

        if(
          document.visibilityState !==
          'visible' ||
          !T()
        ){
          return;
        }


        /*
          Refresh only lightweight account
          state here. Market refresh remains
          controlled by the app's own jobs.
        */

        try{

          await caLoadMe();

          caRebuildBottomNav();

        }catch(e){

          console.warn(
            'Profile refresh skipped',
            e
          );

        }

      }
    );


  /* ==========================================================
     INITIALIZE
     ========================================================== */

  caInitialize();


  /* ==========================================================
     END CARD ANALYST DASHBOARD
     ========================================================== */

})();
