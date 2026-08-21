/* ============================================================
   CARD ANALYST
   SOCIAL PROFILE + VAULT
   Build: CA1500-VAULT
   ============================================================ */

(() => {
  'use strict';

  if (
    typeof api !== 'function' ||
    typeof uid !== 'function' ||
    typeof openSheet !== 'function'
  ) {
    console.error(
      '[Card Analyst Vault] Missing app globals.'
    );
    return;
  }

  const VAULT_BUILD =
    'CA1500-VAULT';

  const STATE = {
    profile:null,
    vault:[],
    friends:[],
    requests:[],
    relationship:null,
    collectors:[],
    sort:'value',
    currentUserId:null
  };


  /* ==========================================================
     STYLE
     ========================================================== */

  const style =
    document.createElement('style');

  style.textContent = `

    /* ======================================================
       SOCIAL PROFILE
       ====================================================== */

    .vaultProfile{
      max-width:760px;
      margin:0 auto;
      padding-bottom:35px;
    }

    .vaultBack{
      border:0;
      background:none;
      color:#8c9792;
      padding:4px 0 14px;
      font-size:11px;
      font-weight:850;
    }

    .vaultProfileTop{
      text-align:center;
      padding:8px 0 4px;
    }

    .vaultSignature{
      width:180px;
      height:245px;
      margin:0 auto 13px;
      padding:8px;

      border-radius:20px;
      border:1px solid #2a3438;

      background:#080b0d;

      display:flex;
      align-items:center;
      justify-content:center;

      overflow:hidden;

      box-shadow:
        0 22px 55px rgba(0,0,0,.28);
    }

    .vaultSignature img{
      width:100%;
      height:100%;
      object-fit:contain;
      display:block;
    }

    .vaultSignatureEmpty{
      color:#68736e;
      font-size:10px;
      font-weight:850;
      line-height:1.45;
      text-align:center;
      padding:14px;
    }

    .vaultProfileName{
      font-size:30px;
      font-weight:950;
      letter-spacing:-.8px;
      line-height:1.05;
    }

    .vaultProfileBio{
      max-width:430px;
      margin:7px auto 0;

      color:#8c9792;

      font-size:11px;
      line-height:1.5;
    }

    .vaultMetrics{
      display:grid;
      grid-template-columns:
        repeat(3,minmax(0,1fr));

      gap:8px;

      margin-top:14px;
    }

    .vaultMetric{
      border:1px solid #242d31;
      border-radius:14px;
      background:#101518;

      padding:11px;
    }

    .vaultMetric small{
      display:block;
      color:#707b76;
      font-size:8px;
      font-weight:850;
      text-transform:uppercase;
      margin-bottom:4px;
    }

    .vaultMetric b{
      font-size:15px;
    }

    .vaultProfileActions{
      display:flex;
      justify-content:center;
      flex-wrap:wrap;
      gap:7px;

      margin-top:13px;
    }

    .vaultAction{
      border:1px solid #2a3539;
      border-radius:12px;

      background:#141a1d;
      color:#fff;

      padding:10px 13px;

      font-size:10px;
      font-weight:900;
    }

    .vaultAction.primary{
      background:#eef8f1;
      border-color:#eef8f1;
      color:#07120a;
    }

    .vaultAction.friend{
      background:#16251d;
      border-color:#2d4a38;
      color:#b8ecc7;
    }


    /* ======================================================
       PROFILE SECTIONS
       ====================================================== */

    .vaultSection{
      margin-top:24px;
    }

    .vaultSectionHead{
      display:flex;
      align-items:flex-end;
      justify-content:space-between;

      margin-bottom:9px;
    }

    .vaultSectionHead h2{
      margin:0;
      font-size:18px;
      letter-spacing:-.3px;
    }

    .vaultSectionHead span{
      color:#75807b;
      font-size:9px;
    }

    .vaultPills{
      display:flex;
      flex-wrap:wrap;
      gap:6px;
    }

    .vaultPill{
      padding:6px 9px;

      border-radius:999px;
      border:1px solid #293338;

      background:#111619;
      color:#b6c1bc;

      font-size:9px;
      font-weight:850;
    }


    /* ======================================================
       FRIENDS
       ====================================================== */

    .vaultFriends{
      display:flex;
      gap:8px;
      overflow-x:auto;

      padding-bottom:5px;

      scrollbar-width:none;
      -webkit-overflow-scrolling:touch;
    }

    .vaultFriends::-webkit-scrollbar{
      display:none;
    }

    .vaultFriend{
      flex:0 0 82px;

      border:0;
      background:none;
      color:#fff;

      padding:0;
      text-align:center;
    }

    .vaultFriendImage{
      width:58px;
      height:58px;
      margin:0 auto;

      border-radius:14px;

      border:1px solid #293338;

      background:#080b0d;

      overflow:hidden;

      display:flex;
      align-items:center;
      justify-content:center;

      font-size:9px;
      font-weight:900;
    }

    .vaultFriendImage img{
      width:100%;
      height:100%;
      object-fit:cover;
    }

    .vaultFriendName{
      margin-top:5px;
      font-size:9px;
      font-weight:850;

      white-space:nowrap;
      overflow:hidden;
      text-overflow:ellipsis;
    }


    /* ======================================================
       FRIEND REQUESTS
       ====================================================== */

    .vaultRequest{
      display:grid;
      grid-template-columns:
        42px 1fr auto;

      gap:9px;
      align-items:center;

      padding:10px 0;

      border-bottom:
        1px solid #20282c;
    }

    .vaultRequest:last-child{
      border-bottom:0;
    }

    .vaultRequestAvatar{
      width:42px;
      height:42px;

      border-radius:11px;

      border:
        1px solid #293338;

      background:#080b0d;

      overflow:hidden;

      display:flex;
      align-items:center;
      justify-content:center;

      font-size:8px;
      font-weight:900;
    }

    .vaultRequestAvatar img{
      width:100%;
      height:100%;
      object-fit:cover;
    }

    .vaultRequestName{
      font-size:11px;
      font-weight:900;
    }

    .vaultRequestActions{
      display:flex;
      gap:5px;
    }

    .vaultRequestBtn{
      border:1px solid #2b3539;
      border-radius:9px;

      background:#151a1d;
      color:#fff;

      padding:7px 8px;

      font-size:8px;
      font-weight:900;
    }

    .vaultRequestBtn.accept{
      background:#eef8f1;
      border-color:#eef8f1;
      color:#07120a;
    }


    /* ======================================================
       ENTER VAULT
       ====================================================== */

    .enterVault{
      width:100%;

      margin-top:20px;

      border:1px solid #34473d;
      border-radius:18px;

      background:
        linear-gradient(
          180deg,
          #17231d,
          #101713
        );

      color:#fff;

      padding:18px;

      text-align:left;
    }

    .enterVault small{
      display:block;

      color:#88a895;

      font-size:8px;
      font-weight:900;

      letter-spacing:.75px;

      text-transform:uppercase;
    }

    .enterVault strong{
      display:block;

      margin-top:5px;

      font-size:21px;
      font-weight:950;
      letter-spacing:-.4px;
    }

    .enterVault span{
      display:block;

      margin-top:4px;

      color:#9ba9a1;

      font-size:10px;
    }


    /* ======================================================
       VAULT SCREEN
       ====================================================== */

    #caVaultPage{
      position:relative;

      max-width:900px;

      margin:0 auto;

      padding-bottom:38px;
    }

    .vaultRoomHeader{
      display:flex;
      align-items:flex-start;
      justify-content:space-between;

      gap:12px;

      margin-bottom:15px;
    }

    .vaultRoomEyebrow{
      color:#718078;

      font-size:9px;
      font-weight:900;

      letter-spacing:.8px;

      text-transform:uppercase;
    }

    .vaultRoomTitle{
      margin-top:4px;

      font-size:30px;
      font-weight:950;
      letter-spacing:-.8px;
    }

    .vaultRoomValue{
      margin-top:4px;

      color:#a5b3ab;

      font-size:11px;
    }

    .vaultExit{
      border:1px solid #293338;
      border-radius:999px;

      background:#111619;
      color:#fff;

      padding:9px 12px;

      font-size:9px;
      font-weight:900;
    }


    /* ======================================================
       FEATURED SHELF
       ====================================================== */

    .vaultFeatured{
      display:flex;
      gap:10px;

      overflow-x:auto;

      padding:
        2px
        2px
        17px;

      margin-bottom:5px;

      scrollbar-width:none;

      scroll-snap-type:
        x mandatory;
    }

    .vaultFeatured::-webkit-scrollbar{
      display:none;
    }

    .vaultFeaturedCard{
      flex:0 0 220px;
      scroll-snap-align:start;

      border:0;
      background:none;
      color:#fff;
      text-align:left;

      padding:0;
    }

    .vaultFeaturedFrame{
      height:300px;

      padding:9px;

      border-radius:20px;

      border:1px solid #39473f;

      background:
        radial-gradient(
          circle at 50% 15%,
          #18221d,
          #080b0d 72%
        );

      display:flex;
      align-items:center;
      justify-content:center;

      overflow:hidden;

      box-shadow:
        0 16px 35px rgba(0,0,0,.25);
    }

    .vaultFeaturedFrame img{
      width:100%;
      height:100%;

      object-fit:contain;
    }

    .vaultFeaturedLabel{
      margin-top:8px;

      font-size:12px;
      font-weight:900;
    }

    .vaultFeaturedValue{
      margin-top:3px;

      color:#aebbb4;

      font-size:10px;
      font-weight:850;
    }


    /* ======================================================
       VAULT CONTROLS
       ====================================================== */

    .vaultControls{
      display:flex;

      gap:7px;

      overflow-x:auto;

      margin:
        8px
        0
        13px;

      scrollbar-width:none;
    }

    .vaultControls::-webkit-scrollbar{
      display:none;
    }

    .vaultSort{
      flex:0 0 auto;

      border:1px solid #283237;
      border-radius:999px;

      background:#101518;
      color:#7e8a84;

      padding:8px 11px;

      font-size:9px;
      font-weight:900;
    }

    .vaultSort.active{
      background:#eef8f1;
      border-color:#eef8f1;
      color:#07120a;
    }


    /* ======================================================
       VAULT WALL
       ====================================================== */

    .vaultWall{
      display:grid;

      grid-template-columns:
        repeat(2,minmax(0,1fr));

      gap:
        17px
        10px;
    }

    .vaultWallCard{
      border:0;

      background:none;
      color:#fff;

      padding:0;

      text-align:left;
    }

    .vaultWallFrame{
      position:relative;

      aspect-ratio:3/4;

      padding:8px;

      border-radius:17px;

      border:1px solid #273136;

      background:
        linear-gradient(
          180deg,
          #101619,
          #080b0d
        );

      display:flex;
      align-items:center;
      justify-content:center;

      overflow:hidden;
    }

    .vaultWallFrame img{
      width:100%;
      height:100%;

      object-fit:contain;

      display:block;
    }

    .vaultOwnedBadge{
      position:absolute;

      left:8px;
      bottom:8px;

      padding:4px 6px;

      border-radius:999px;

      background:
        rgba(8,11,13,.86);

      border:
        1px solid #35423c;

      color:#b7e9c5;

      font-size:7px;
      font-weight:950;

      -webkit-backdrop-filter:
        blur(10px);

      backdrop-filter:
        blur(10px);
    }

    .vaultWallName{
      margin-top:7px;

      font-size:11px;
      font-weight:900;

      line-height:1.3;
    }

    .vaultWallMeta{
      margin-top:3px;

      color:#75807b;

      font-size:8px;
      line-height:1.35;
    }

    .vaultWallValue{
      margin-top:5px;

      font-size:14px;
      font-weight:950;
    }


    /* ======================================================
       DISCOVER COLLECTORS
       ====================================================== */

    .vaultSearch{
      display:grid;

      grid-template-columns:
        1fr auto;

      gap:7px;

      margin-top:9px;
    }

    .vaultSearch .input{
      margin-top:0;
    }

    .vaultSearch button{
      border:0;

      border-radius:13px;

      background:#eef8f1;
      color:#07120a;

      padding:0 14px;

      font-weight:900;
    }

    .vaultCollectors{
      display:grid;

      grid-template-columns:
        repeat(2,minmax(0,1fr));

      gap:8px;

      margin-top:10px;
    }

    .vaultCollector{
      border:1px solid #263035;
      border-radius:14px;

      background:#101518;
      color:#fff;

      padding:10px;

      text-align:left;
    }

    .vaultCollectorTop{
      display:grid;

      grid-template-columns:
        42px 1fr;

      gap:8px;

      align-items:center;
    }

    .vaultCollectorAvatar{
      width:42px;
      height:42px;

      border-radius:11px;

      border:1px solid #293338;

      background:#080b0d;

      overflow:hidden;

      display:flex;
      align-items:center;
      justify-content:center;

      font-size:8px;
      font-weight:900;
    }

    .vaultCollectorAvatar img{
      width:100%;
      height:100%;
      object-fit:cover;
    }

    .vaultCollectorName{
      font-size:11px;
      font-weight:900;
    }

    .vaultCollectorMeta{
      margin-top:3px;

      color:#7e8984;

      font-size:8px;
    }


    @media(min-width:700px){

      .vaultWall{
        grid-template-columns:
          repeat(3,minmax(0,1fr));
      }

      .vaultCollectors{
        grid-template-columns:
          repeat(3,minmax(0,1fr));
      }

    }

    @media(max-width:390px){

      .vaultMetrics{
        grid-template-columns:
          repeat(2,minmax(0,1fr));
      }

      .vaultSignature{
        width:165px;
        height:225px;
      }

      .vaultFeaturedCard{
        flex-basis:200px;
      }

      .vaultFeaturedFrame{
        height:275px;
      }

    }

  `;

  document.head.appendChild(
    style
  );


  /* ==========================================================
     HELPERS
     ========================================================== */

  const esc =
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


  const money =
    value => {

      const n =
        Number(value);

      if (
        !Number.isFinite(n)
      ) {
        return '—';
      }

      return new Intl.NumberFormat(
        'en-US',
        {
          style:'currency',
          currency:'USD',
          maximumFractionDigits:
            Math.abs(n) < 100
              ? 2
              : 0
        }
      ).format(n);

    };


  const arr =
    value =>
      Array.isArray(value)
        ? value
        : [];


  function profileId(
    p
  ) {
    return (
      p?.user_id ||
      p?.id ||
      null
    );
  }


  function profileSince(
    p
  ) {
    return (
      p?.member_since ||
      p?.created_at ||
      null
    );
  }


  function vaultValue(){

    return STATE.vault.reduce(
      (sum,row) =>
        sum +
        (
          Number(
            row.position_value
          ) || 0
        ),
      0
    );

  }


  function hideCorePages(){

    [
      'portfolio',
      'add',
      'goose',
      'watchlist',
      'flips',
      'caProfilePage',
      'caSocialProfilePage',
      'caVaultPage'
    ]
      .forEach(
        id =>
          document
            .getElementById(id)
            ?.classList.add(
              'hidden'
            )
      );


    document
      .querySelectorAll(
        '#nav button'
      )
      .forEach(
        b =>
          b.classList.remove(
            'active'
          )
      );

  }


  function returnPortfolio(){

    document
      .getElementById(
        'caSocialProfilePage'
      )
      ?.classList.add(
        'hidden'
      );


    document
      .getElementById(
        'caVaultPage'
      )
      ?.classList.add(
        'hidden'
      );


    view(
      'portfolio'
    );


    window.scrollTo({
      top:0,
      behavior:'smooth'
    });

  }


  /* ==========================================================
     CREATE SOCIAL PAGES
     ========================================================== */

  const app =
    document.querySelector(
      '.app'
    );


  let profilePage =
    document.getElementById(
      'caSocialProfilePage'
    );


  if(!profilePage){

    profilePage =
      document.createElement(
        'section'
      );

    profilePage.id =
      'caSocialProfilePage';

    profilePage.className =
      'hidden';

    app?.appendChild(
      profilePage
    );

  }


  let vaultPage =
    document.getElementById(
      'caVaultPage'
    );


  if(!vaultPage){

    vaultPage =
      document.createElement(
        'section'
      );

    vaultPage.id =
      'caVaultPage';

    vaultPage.className =
      'hidden';

    app?.appendChild(
      vaultPage
    );

  }


  /* ==========================================================
     DATA LOADERS
     ========================================================== */

  async function loadProfile(
    userId
  ){

    const [
      profileRows,
      vaultRows,
      friendSummary,
      friends
    ] =
      await Promise.all([

        api(
          '/rest/v1/rpc/get_public_profile_v1',
          {
            method:'POST',

            body:JSON.stringify({
              p_user_id:userId
            })
          }
        ),

        api(
          '/rest/v1/rpc/get_public_vault_v1',
          {
            method:'POST',

            body:JSON.stringify({
              p_user_id:userId
            })
          }
        ),

        api(
          '/rest/v1/rpc/friend_summary_v1',
          {
            method:'POST',

            body:JSON.stringify({
              p_user_id:userId
            })
          }
        ),

        api(
          '/rest/v1/rpc/list_friends_v1',
          {
            method:'POST',

            body:JSON.stringify({
              p_user_id:userId
            })
          }
        )

      ]);


    STATE.profile =
      Array.isArray(
        profileRows
      )
        ? profileRows[0] || null
        : null;


    STATE.vault =
      Array.isArray(
        vaultRows
      )
        ? vaultRows
        : [];


    STATE.relationship =
      friendSummary ||
      {
        friend_count:0,
        mutual_friend_count:0,
        relationship_status:'none'
      };


    STATE.friends =
      Array.isArray(
        friends
      )
        ? friends
        : [];


    STATE.currentUserId =
      userId;


    if(
      userId === uid()
    ){

      STATE.requests =
        await api(
          '/rest/v1/rpc/list_friend_requests_v1',
          {
            method:'POST',
            body:JSON.stringify({})
          }
        )
          .catch(
            () => []
          );

    }else{

      STATE.requests = [];

    }

  }


  async function searchCollectors(
    query = ''
  ){

    STATE.collectors =
      await api(
        '/rest/v1/rpc/list_public_profiles_v1',
        {
          method:'POST',

          body:JSON.stringify({
            p_query:
              query || null,

            p_limit:50
          })
        }
      )
        .catch(
          () => []
        );

  }


  /* ==========================================================
     FRIEND ACTIONS
     ========================================================== */

  async function sendFriendRequest(){

    await api(
      '/rest/v1/rpc/send_friend_request_v1',
      {
        method:'POST',

        body:JSON.stringify({
          p_other_user_id:
            STATE.currentUserId
        })
      }
    );


    await openSocialProfile(
      STATE.currentUserId
    );

  }


  async function respondFriend(
    friendshipId,
    accept
  ){

    await api(
      '/rest/v1/rpc/respond_friend_request_v1',
      {
        method:'POST',

        body:JSON.stringify({
          p_friendship_id:
            friendshipId,

          p_accept:
            !!accept
        })
      }
    );


    await openSocialProfile(
      uid()
    );

  }


  async function removeFriend(){

    if(
      !confirm(
        'Remove this collector from your friends?'
      )
    ){
      return;
    }


    await api(
      '/rest/v1/rpc/remove_friend_v1',
      {
        method:'POST',

        body:JSON.stringify({
          p_other_user_id:
            STATE.currentUserId
        })
      }
    );


    await openSocialProfile(
      STATE.currentUserId
    );

  }


  /* ==========================================================
     RELATIONSHIP BUTTON
     ========================================================== */

  function relationshipButton(){

    if(
      STATE.currentUserId ===
      uid()
    ){

      return '';

    }


    const rel =
      STATE.relationship || {};


    if(
      rel.relationship_status ===
      'accepted'
    ){

      return `
        <button
          id="vaultFriendButton"
          class="
            vaultAction
            friend
          "
        >
          Friends ✓
        </button>
      `;

    }


    if(
      rel.relationship_status ===
      'pending' &&
      rel.relationship_direction ===
      'outgoing'
    ){

      return `
        <button
          class="vaultAction"
          disabled
        >
          Request sent
        </button>
      `;

    }


    if(
      rel.relationship_status ===
      'pending' &&
      rel.relationship_direction ===
      'incoming'
    ){

      return `
        <button
          id="vaultAcceptIncoming"
          class="
            vaultAction
            primary
          "
        >
          Accept friend
        </button>
      `;

    }


    return `
      <button
        id="vaultFriendButton"
        class="
          vaultAction
          friend
        "
      >
        Add Friend
      </button>
    `;

  }


  /* ==========================================================
     FRIEND LIST HTML
     ========================================================== */

  function friendsHtml(){

    if(
      !STATE.friends.length
    ){

      return `
        <div
          class="muted"
          style="
            font-size:10px;
            padding:7px 0;
          "
        >
          No friends yet.
        </div>
      `;

    }


    return `
      <div
        class="vaultFriends"
      >

        ${
          STATE.friends
            .map(
              friend => `
                <button
                  class="vaultFriend"
                  data-vault-friend="${
                    esc(
                      friend.user_id
                    )
                  }"
                >

                  <div
                    class="vaultFriendImage"
                  >

                    ${
                      friend.avatar_image_url
                        ? `
                          <img
                            src="${
                              esc(
                                friend
                                  .avatar_image_url
                              )
                            }"
                            alt="Friend"
                          >
                        `
                        : 'CA'
                    }

                  </div>


                  <div
                    class="vaultFriendName"
                  >
                    ${
                      esc(
                        friend.display_name ||
                        'Collector'
                      )
                    }
                  </div>

                </button>
              `
            )
            .join('')
        }

      </div>
    `;

  }


  /* ==========================================================
     FRIEND REQUESTS HTML
     ========================================================== */

  function requestsHtml(){

    if(
      STATE.currentUserId !==
        uid() ||
      !STATE.requests.length
    ){

      return '';

    }


    return `
      <div
        class="vaultSection"
      >

        <div
          class="vaultSectionHead"
        >
          <h2>
            Friend requests
          </h2>

          <span>
            ${
              STATE.requests.length
            }
          </span>
        </div>


        <div class="card">

          ${
            STATE.requests
              .map(
                req => `
                  <div
                    class="vaultRequest"
                  >

                    <div
                      class="vaultRequestAvatar"
                    >
                      ${
                        req.avatar_image_url
                          ? `
                            <img
                              src="${
                                esc(
                                  req
                                    .avatar_image_url
                                )
                              }"
                              alt="Request"
                            >
                          `
                          : 'CA'
                      }
                    </div>


                    <div
                      class="vaultRequestName"
                    >
                      ${
                        esc(
                          req.display_name ||
                          'Collector'
                        )
                      }
                    </div>


                    <div
                      class="vaultRequestActions"
                    >

                      <button
                        class="
                          vaultRequestBtn
                          accept
                        "
                        data-vault-accept="${
                          esc(
                            req.friendship_id
                          )
                        }"
                      >
                        Accept
                      </button>


                      <button
                        class="vaultRequestBtn"
                        data-vault-decline="${
                          esc(
                            req.friendship_id
                          )
                        }"
                      >
                        Decline
                      </button>

                    </div>

                  </div>
                `
              )
              .join('')
          }

        </div>

      </div>
    `;

  }


  /* ==========================================================
     END CHUNK 1
     Paste Chunk 2 directly underneath.
     ========================================================== */
/* ============================================================
   CARD ANALYST
   SOCIAL PROFILE + VAULT
   Build: CA1500-VAULT
   ============================================================ */

(() => {
  'use strict';

  if (
    typeof api !== 'function' ||
    typeof uid !== 'function' ||
    typeof openSheet !== 'function'
  ) {
    console.error(
      '[Card Analyst Vault] Missing app globals.'
    );
    return;
  }

  const VAULT_BUILD =
    'CA1500-VAULT';

  const STATE = {
    profile:null,
    vault:[],
    friends:[],
    requests:[],
    relationship:null,
    collectors:[],
    sort:'value',
    currentUserId:null
  };


  /* ==========================================================
     STYLE
     ========================================================== */

  const style =
    document.createElement('style');

  style.textContent = `

    /* ======================================================
       SOCIAL PROFILE
       ====================================================== */

    .vaultProfile{
      max-width:760px;
      margin:0 auto;
      padding-bottom:35px;
    }

    .vaultBack{
      border:0;
      background:none;
      color:#8c9792;
      padding:4px 0 14px;
      font-size:11px;
      font-weight:850;
    }

    .vaultProfileTop{
      text-align:center;
      padding:8px 0 4px;
    }

    .vaultSignature{
      width:180px;
      height:245px;
      margin:0 auto 13px;
      padding:8px;

      border-radius:20px;
      border:1px solid #2a3438;

      background:#080b0d;

      display:flex;
      align-items:center;
      justify-content:center;

      overflow:hidden;

      box-shadow:
        0 22px 55px rgba(0,0,0,.28);
    }

    .vaultSignature img{
      width:100%;
      height:100%;
      object-fit:contain;
      display:block;
    }

    .vaultSignatureEmpty{
      color:#68736e;
      font-size:10px;
      font-weight:850;
      line-height:1.45;
      text-align:center;
      padding:14px;
    }

    .vaultProfileName{
      font-size:30px;
      font-weight:950;
      letter-spacing:-.8px;
      line-height:1.05;
    }

    .vaultProfileBio{
      max-width:430px;
      margin:7px auto 0;

      color:#8c9792;

      font-size:11px;
      line-height:1.5;
    }

    .vaultMetrics{
      display:grid;
      grid-template-columns:
        repeat(3,minmax(0,1fr));

      gap:8px;

      margin-top:14px;
    }

    .vaultMetric{
      border:1px solid #242d31;
      border-radius:14px;
      background:#101518;

      padding:11px;
    }

    .vaultMetric small{
      display:block;
      color:#707b76;
      font-size:8px;
      font-weight:850;
      text-transform:uppercase;
      margin-bottom:4px;
    }

    .vaultMetric b{
      font-size:15px;
    }

    .vaultProfileActions{
      display:flex;
      justify-content:center;
      flex-wrap:wrap;
      gap:7px;

      margin-top:13px;
    }

    .vaultAction{
      border:1px solid #2a3539;
      border-radius:12px;

      background:#141a1d;
      color:#fff;

      padding:10px 13px;

      font-size:10px;
      font-weight:900;
    }

    .vaultAction.primary{
      background:#eef8f1;
      border-color:#eef8f1;
      color:#07120a;
    }

    .vaultAction.friend{
      background:#16251d;
      border-color:#2d4a38;
      color:#b8ecc7;
    }


    /* ======================================================
       PROFILE SECTIONS
       ====================================================== */

    .vaultSection{
      margin-top:24px;
    }

    .vaultSectionHead{
      display:flex;
      align-items:flex-end;
      justify-content:space-between;

      margin-bottom:9px;
    }

    .vaultSectionHead h2{
      margin:0;
      font-size:18px;
      letter-spacing:-.3px;
    }

    .vaultSectionHead span{
      color:#75807b;
      font-size:9px;
    }

    .vaultPills{
      display:flex;
      flex-wrap:wrap;
      gap:6px;
    }

    .vaultPill{
      padding:6px 9px;

      border-radius:999px;
      border:1px solid #293338;

      background:#111619;
      color:#b6c1bc;

      font-size:9px;
      font-weight:850;
    }


    /* ======================================================
       FRIENDS
       ====================================================== */

    .vaultFriends{
      display:flex;
      gap:8px;
      overflow-x:auto;

      padding-bottom:5px;

      scrollbar-width:none;
      -webkit-overflow-scrolling:touch;
    }

    .vaultFriends::-webkit-scrollbar{
      display:none;
    }

    .vaultFriend{
      flex:0 0 82px;

      border:0;
      background:none;
      color:#fff;

      padding:0;
      text-align:center;
    }

    .vaultFriendImage{
      width:58px;
      height:58px;
      margin:0 auto;

      border-radius:14px;

      border:1px solid #293338;

      background:#080b0d;

      overflow:hidden;

      display:flex;
      align-items:center;
      justify-content:center;

      font-size:9px;
      font-weight:900;
    }

    .vaultFriendImage img{
      width:100%;
      height:100%;
      object-fit:cover;
    }

    .vaultFriendName{
      margin-top:5px;
      font-size:9px;
      font-weight:850;

      white-space:nowrap;
      overflow:hidden;
      text-overflow:ellipsis;
    }


    /* ======================================================
       FRIEND REQUESTS
       ====================================================== */

    .vaultRequest{
      display:grid;
      grid-template-columns:
        42px 1fr auto;

      gap:9px;
      align-items:center;

      padding:10px 0;

      border-bottom:
        1px solid #20282c;
    }

    .vaultRequest:last-child{
      border-bottom:0;
    }

    .vaultRequestAvatar{
      width:42px;
      height:42px;

      border-radius:11px;

      border:
        1px solid #293338;

      background:#080b0d;

      overflow:hidden;

      display:flex;
      align-items:center;
      justify-content:center;

      font-size:8px;
      font-weight:900;
    }

    .vaultRequestAvatar img{
      width:100%;
      height:100%;
      object-fit:cover;
    }

    .vaultRequestName{
      font-size:11px;
      font-weight:900;
    }

    .vaultRequestActions{
      display:flex;
      gap:5px;
    }

    .vaultRequestBtn{
      border:1px solid #2b3539;
      border-radius:9px;

      background:#151a1d;
      color:#fff;

      padding:7px 8px;

      font-size:8px;
      font-weight:900;
    }

    .vaultRequestBtn.accept{
      background:#eef8f1;
      border-color:#eef8f1;
      color:#07120a;
    }


    /* ======================================================
       ENTER VAULT
       ====================================================== */

    .enterVault{
      width:100%;

      margin-top:20px;

      border:1px solid #34473d;
      border-radius:18px;

      background:
        linear-gradient(
          180deg,
          #17231d,
          #101713
        );

      color:#fff;

      padding:18px;

      text-align:left;
    }

    .enterVault small{
      display:block;

      color:#88a895;

      font-size:8px;
      font-weight:900;

      letter-spacing:.75px;

      text-transform:uppercase;
    }

    .enterVault strong{
      display:block;

      margin-top:5px;

      font-size:21px;
      font-weight:950;
      letter-spacing:-.4px;
    }

    .enterVault span{
      display:block;

      margin-top:4px;

      color:#9ba9a1;

      font-size:10px;
    }


    /* ======================================================
       VAULT SCREEN
       ====================================================== */

    #caVaultPage{
      position:relative;

      max-width:900px;

      margin:0 auto;

      padding-bottom:38px;
    }

    .vaultRoomHeader{
      display:flex;
      align-items:flex-start;
      justify-content:space-between;

      gap:12px;

      margin-bottom:15px;
    }

    .vaultRoomEyebrow{
      color:#718078;

      font-size:9px;
      font-weight:900;

      letter-spacing:.8px;

      text-transform:uppercase;
    }

    .vaultRoomTitle{
      margin-top:4px;

      font-size:30px;
      font-weight:950;
      letter-spacing:-.8px;
    }

    .vaultRoomValue{
      margin-top:4px;

      color:#a5b3ab;

      font-size:11px;
    }

    .vaultExit{
      border:1px solid #293338;
      border-radius:999px;

      background:#111619;
      color:#fff;

      padding:9px 12px;

      font-size:9px;
      font-weight:900;
    }


    /* ======================================================
       FEATURED SHELF
       ====================================================== */

    .vaultFeatured{
      display:flex;
      gap:10px;

      overflow-x:auto;

      padding:
        2px
        2px
        17px;

      margin-bottom:5px;

      scrollbar-width:none;

      scroll-snap-type:
        x mandatory;
    }

    .vaultFeatured::-webkit-scrollbar{
      display:none;
    }

    .vaultFeaturedCard{
      flex:0 0 220px;
      scroll-snap-align:start;

      border:0;
      background:none;
      color:#fff;
      text-align:left;

      padding:0;
    }

    .vaultFeaturedFrame{
      height:300px;

      padding:9px;

      border-radius:20px;

      border:1px solid #39473f;

      background:
        radial-gradient(
          circle at 50% 15%,
          #18221d,
          #080b0d 72%
        );

      display:flex;
      align-items:center;
      justify-content:center;

      overflow:hidden;

      box-shadow:
        0 16px 35px rgba(0,0,0,.25);
    }

    .vaultFeaturedFrame img{
      width:100%;
      height:100%;

      object-fit:contain;
    }

    .vaultFeaturedLabel{
      margin-top:8px;

      font-size:12px;
      font-weight:900;
    }

    .vaultFeaturedValue{
      margin-top:3px;

      color:#aebbb4;

      font-size:10px;
      font-weight:850;
    }


    /* ======================================================
       VAULT CONTROLS
       ====================================================== */

    .vaultControls{
      display:flex;

      gap:7px;

      overflow-x:auto;

      margin:
        8px
        0
        13px;

      scrollbar-width:none;
    }

    .vaultControls::-webkit-scrollbar{
      display:none;
    }

    .vaultSort{
      flex:0 0 auto;

      border:1px solid #283237;
      border-radius:999px;

      background:#101518;
      color:#7e8a84;

      padding:8px 11px;

      font-size:9px;
      font-weight:900;
    }

    .vaultSort.active{
      background:#eef8f1;
      border-color:#eef8f1;
      color:#07120a;
    }


    /* ======================================================
       VAULT WALL
       ====================================================== */

    .vaultWall{
      display:grid;

      grid-template-columns:
        repeat(2,minmax(0,1fr));

      gap:
        17px
        10px;
    }

    .vaultWallCard{
      border:0;

      background:none;
      color:#fff;

      padding:0;

      text-align:left;
    }

    .vaultWallFrame{
      position:relative;

      aspect-ratio:3/4;

      padding:8px;

      border-radius:17px;

      border:1px solid #273136;

      background:
        linear-gradient(
          180deg,
          #101619,
          #080b0d
        );

      display:flex;
      align-items:center;
      justify-content:center;

      overflow:hidden;
    }

    .vaultWallFrame img{
      width:100%;
      height:100%;

      object-fit:contain;

      display:block;
    }

    .vaultOwnedBadge{
      position:absolute;

      left:8px;
      bottom:8px;

      padding:4px 6px;

      border-radius:999px;

      background:
        rgba(8,11,13,.86);

      border:
        1px solid #35423c;

      color:#b7e9c5;

      font-size:7px;
      font-weight:950;

      -webkit-backdrop-filter:
        blur(10px);

      backdrop-filter:
        blur(10px);
    }

    .vaultWallName{
      margin-top:7px;

      font-size:11px;
      font-weight:900;

      line-height:1.3;
    }

    .vaultWallMeta{
      margin-top:3px;

      color:#75807b;

      font-size:8px;
      line-height:1.35;
    }

    .vaultWallValue{
      margin-top:5px;

      font-size:14px;
      font-weight:950;
    }


    /* ======================================================
       DISCOVER COLLECTORS
       ====================================================== */

    .vaultSearch{
      display:grid;

      grid-template-columns:
        1fr auto;

      gap:7px;

      margin-top:9px;
    }

    .vaultSearch .input{
      margin-top:0;
    }

    .vaultSearch button{
      border:0;

      border-radius:13px;

      background:#eef8f1;
      color:#07120a;

      padding:0 14px;

      font-weight:900;
    }

    .vaultCollectors{
      display:grid;

      grid-template-columns:
        repeat(2,minmax(0,1fr));

      gap:8px;

      margin-top:10px;
    }

    .vaultCollector{
      border:1px solid #263035;
      border-radius:14px;

      background:#101518;
      color:#fff;

      padding:10px;

      text-align:left;
    }

    .vaultCollectorTop{
      display:grid;

      grid-template-columns:
        42px 1fr;

      gap:8px;

      align-items:center;
    }

    .vaultCollectorAvatar{
      width:42px;
      height:42px;

      border-radius:11px;

      border:1px solid #293338;

      background:#080b0d;

      overflow:hidden;

      display:flex;
      align-items:center;
      justify-content:center;

      font-size:8px;
      font-weight:900;
    }

    .vaultCollectorAvatar img{
      width:100%;
      height:100%;
      object-fit:cover;
    }

    .vaultCollectorName{
      font-size:11px;
      font-weight:900;
    }

    .vaultCollectorMeta{
      margin-top:3px;

      color:#7e8984;

      font-size:8px;
    }


    @media(min-width:700px){

      .vaultWall{
        grid-template-columns:
          repeat(3,minmax(0,1fr));
      }

      .vaultCollectors{
        grid-template-columns:
          repeat(3,minmax(0,1fr));
      }

    }

    @media(max-width:390px){

      .vaultMetrics{
        grid-template-columns:
          repeat(2,minmax(0,1fr));
      }

      .vaultSignature{
        width:165px;
        height:225px;
      }

      .vaultFeaturedCard{
        flex-basis:200px;
      }

      .vaultFeaturedFrame{
        height:275px;
      }

    }

  `;

  document.head.appendChild(
    style
  );


  /* ==========================================================
     HELPERS
     ========================================================== */

  const esc =
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


  const money =
    value => {

      const n =
        Number(value);

      if (
        !Number.isFinite(n)
      ) {
        return '—';
      }

      return new Intl.NumberFormat(
        'en-US',
        {
          style:'currency',
          currency:'USD',
          maximumFractionDigits:
            Math.abs(n) < 100
              ? 2
              : 0
        }
      ).format(n);

    };


  const arr =
    value =>
      Array.isArray(value)
        ? value
        : [];


  function profileId(
    p
  ) {
    return (
      p?.user_id ||
      p?.id ||
      null
    );
  }


  function profileSince(
    p
  ) {
    return (
      p?.member_since ||
      p?.created_at ||
      null
    );
  }


  function vaultValue(){

    return STATE.vault.reduce(
      (sum,row) =>
        sum +
        (
          Number(
            row.position_value
          ) || 0
        ),
      0
    );

  }


  function hideCorePages(){

    [
      'portfolio',
      'add',
      'goose',
      'watchlist',
      'flips',
      'caProfilePage',
      'caSocialProfilePage',
      'caVaultPage'
    ]
      .forEach(
        id =>
          document
            .getElementById(id)
            ?.classList.add(
              'hidden'
            )
      );


    document
      .querySelectorAll(
        '#nav button'
      )
      .forEach(
        b =>
          b.classList.remove(
            'active'
          )
      );

  }


  function returnPortfolio(){

    document
      .getElementById(
        'caSocialProfilePage'
      )
      ?.classList.add(
        'hidden'
      );


    document
      .getElementById(
        'caVaultPage'
      )
      ?.classList.add(
        'hidden'
      );


    view(
      'portfolio'
    );


    window.scrollTo({
      top:0,
      behavior:'smooth'
    });

  }


  /* ==========================================================
     CREATE SOCIAL PAGES
     ========================================================== */

  const app =
    document.querySelector(
      '.app'
    );


  let profilePage =
    document.getElementById(
      'caSocialProfilePage'
    );


  if(!profilePage){

    profilePage =
      document.createElement(
        'section'
      );

    profilePage.id =
      'caSocialProfilePage';

    profilePage.className =
      'hidden';

    app?.appendChild(
      profilePage
    );

  }


  let vaultPage =
    document.getElementById(
      'caVaultPage'
    );


  if(!vaultPage){

    vaultPage =
      document.createElement(
        'section'
      );

    vaultPage.id =
      'caVaultPage';

    vaultPage.className =
      'hidden';

    app?.appendChild(
      vaultPage
    );

  }


  /* ==========================================================
     DATA LOADERS
     ========================================================== */

  async function loadProfile(
    userId
  ){

    const [
      profileRows,
      vaultRows,
      friendSummary,
      friends
    ] =
      await Promise.all([

        api(
          '/rest/v1/rpc/get_public_profile_v1',
          {
            method:'POST',

            body:JSON.stringify({
              p_user_id:userId
            })
          }
        ),

        api(
          '/rest/v1/rpc/get_public_vault_v1',
          {
            method:'POST',

            body:JSON.stringify({
              p_user_id:userId
            })
          }
        ),

        api(
          '/rest/v1/rpc/friend_summary_v1',
          {
            method:'POST',

            body:JSON.stringify({
              p_user_id:userId
            })
          }
        ),

        api(
          '/rest/v1/rpc/list_friends_v1',
          {
            method:'POST',

            body:JSON.stringify({
              p_user_id:userId
            })
          }
        )

      ]);


    STATE.profile =
      Array.isArray(
        profileRows
      )
        ? profileRows[0] || null
        : null;


    STATE.vault =
      Array.isArray(
        vaultRows
      )
        ? vaultRows
        : [];


    STATE.relationship =
      friendSummary ||
      {
        friend_count:0,
        mutual_friend_count:0,
        relationship_status:'none'
      };


    STATE.friends =
      Array.isArray(
        friends
      )
        ? friends
        : [];


    STATE.currentUserId =
      userId;


    if(
      userId === uid()
    ){

      STATE.requests =
        await api(
          '/rest/v1/rpc/list_friend_requests_v1',
          {
            method:'POST',
            body:JSON.stringify({})
          }
        )
          .catch(
            () => []
          );

    }else{

      STATE.requests = [];

    }

  }


  async function searchCollectors(
    query = ''
  ){

    STATE.collectors =
      await api(
        '/rest/v1/rpc/list_public_profiles_v1',
        {
          method:'POST',

          body:JSON.stringify({
            p_query:
              query || null,

            p_limit:50
          })
        }
      )
        .catch(
          () => []
        );

  }


  /* ==========================================================
     FRIEND ACTIONS
     ========================================================== */

  async function sendFriendRequest(){

    await api(
      '/rest/v1/rpc/send_friend_request_v1',
      {
        method:'POST',

        body:JSON.stringify({
          p_other_user_id:
            STATE.currentUserId
        })
      }
    );


    await openSocialProfile(
      STATE.currentUserId
    );

  }


  async function respondFriend(
    friendshipId,
    accept
  ){

    await api(
      '/rest/v1/rpc/respond_friend_request_v1',
      {
        method:'POST',

        body:JSON.stringify({
          p_friendship_id:
            friendshipId,

          p_accept:
            !!accept
        })
      }
    );


    await openSocialProfile(
      uid()
    );

  }


  async function removeFriend(){

    if(
      !confirm(
        'Remove this collector from your friends?'
      )
    ){
      return;
    }


    await api(
      '/rest/v1/rpc/remove_friend_v1',
      {
        method:'POST',

        body:JSON.stringify({
          p_other_user_id:
            STATE.currentUserId
        })
      }
    );


    await openSocialProfile(
      STATE.currentUserId
    );

  }


  /* ==========================================================
     RELATIONSHIP BUTTON
     ========================================================== */

  function relationshipButton(){

    if(
      STATE.currentUserId ===
      uid()
    ){

      return '';

    }


    const rel =
      STATE.relationship || {};


    if(
      rel.relationship_status ===
      'accepted'
    ){

      return `
        <button
          id="vaultFriendButton"
          class="
            vaultAction
            friend
          "
        >
          Friends ✓
        </button>
      `;

    }


    if(
      rel.relationship_status ===
      'pending' &&
      rel.relationship_direction ===
      'outgoing'
    ){

      return `
        <button
          class="vaultAction"
          disabled
        >
          Request sent
        </button>
      `;

    }


    if(
      rel.relationship_status ===
      'pending' &&
      rel.relationship_direction ===
      'incoming'
    ){

      return `
        <button
          id="vaultAcceptIncoming"
          class="
            vaultAction
            primary
          "
        >
          Accept friend
        </button>
      `;

    }


    return `
      <button
        id="vaultFriendButton"
        class="
          vaultAction
          friend
        "
      >
        Add Friend
      </button>
    `;

  }


  /* ==========================================================
     FRIEND LIST HTML
     ========================================================== */

  function friendsHtml(){

    if(
      !STATE.friends.length
    ){

      return `
        <div
          class="muted"
          style="
            font-size:10px;
            padding:7px 0;
          "
        >
          No friends yet.
        </div>
      `;

    }


    return `
      <div
        class="vaultFriends"
      >

        ${
          STATE.friends
            .map(
              friend => `
                <button
                  class="vaultFriend"
                  data-vault-friend="${
                    esc(
                      friend.user_id
                    )
                  }"
                >

                  <div
                    class="vaultFriendImage"
                  >

                    ${
                      friend.avatar_image_url
                        ? `
                          <img
                            src="${
                              esc(
                                friend
                                  .avatar_image_url
                              )
                            }"
                            alt="Friend"
                          >
                        `
                        : 'CA'
                    }

                  </div>


                  <div
                    class="vaultFriendName"
                  >
                    ${
                      esc(
                        friend.display_name ||
                        'Collector'
                      )
                    }
                  </div>

                </button>
              `
            )
            .join('')
        }

      </div>
    `;

  }


  /* ==========================================================
     FRIEND REQUESTS HTML
     ========================================================== */

  function requestsHtml(){

    if(
      STATE.currentUserId !==
        uid() ||
      !STATE.requests.length
    ){

      return '';

    }


    return `
      <div
        class="vaultSection"
      >

        <div
          class="vaultSectionHead"
        >
          <h2>
            Friend requests
          </h2>

          <span>
            ${
              STATE.requests.length
            }
          </span>
        </div>


        <div class="card">

          ${
            STATE.requests
              .map(
                req => `
                  <div
                    class="vaultRequest"
                  >

                    <div
                      class="vaultRequestAvatar"
                    >
                      ${
                        req.avatar_image_url
                          ? `
                            <img
                              src="${
                                esc(
                                  req
                                    .avatar_image_url
                                )
                              }"
                              alt="Request"
                            >
                          `
                          : 'CA'
                      }
                    </div>


                    <div
                      class="vaultRequestName"
                    >
                      ${
                        esc(
                          req.display_name ||
                          'Collector'
                        )
                      }
                    </div>


                    <div
                      class="vaultRequestActions"
                    >

                      <button
                        class="
                          vaultRequestBtn
                          accept
                        "
                        data-vault-accept="${
                          esc(
                            req.friendship_id
                          )
                        }"
                      >
                        Accept
                      </button>


                      <button
                        class="vaultRequestBtn"
                        data-vault-decline="${
                          esc(
                            req.friendship_id
                          )
                        }"
                      >
                        Decline
                      </button>

                    </div>

                  </div>
                `
              )
              .join('')
          }

        </div>

      </div>
    `;

  }


  /* ==========================================================
     END CHUNK 1
     Paste Chunk 2 directly underneath.
     ========================================================== */
/* ============================================================
   CARD ANALYST
   SOCIAL PROFILE + VAULT
   Build: CA1500-VAULT
   ============================================================ */

(() => {
  'use strict';

  if (
    typeof api !== 'function' ||
    typeof uid !== 'function' ||
    typeof openSheet !== 'function'
  ) {
    console.error(
      '[Card Analyst Vault] Missing app globals.'
    );
    return;
  }

  const VAULT_BUILD =
    'CA1500-VAULT';

  const STATE = {
    profile:null,
    vault:[],
    friends:[],
    requests:[],
    relationship:null,
    collectors:[],
    sort:'value',
    currentUserId:null
  };


  /* ==========================================================
     STYLE
     ========================================================== */

  const style =
    document.createElement('style');

  style.textContent = `

    /* ======================================================
       SOCIAL PROFILE
       ====================================================== */

    .vaultProfile{
      max-width:760px;
      margin:0 auto;
      padding-bottom:35px;
    }

    .vaultBack{
      border:0;
      background:none;
      color:#8c9792;
      padding:4px 0 14px;
      font-size:11px;
      font-weight:850;
    }

    .vaultProfileTop{
      text-align:center;
      padding:8px 0 4px;
    }

    .vaultSignature{
      width:180px;
      height:245px;
      margin:0 auto 13px;
      padding:8px;

      border-radius:20px;
      border:1px solid #2a3438;

      background:#080b0d;

      display:flex;
      align-items:center;
      justify-content:center;

      overflow:hidden;

      box-shadow:
        0 22px 55px rgba(0,0,0,.28);
    }

    .vaultSignature img{
      width:100%;
      height:100%;
      object-fit:contain;
      display:block;
    }

    .vaultSignatureEmpty{
      color:#68736e;
      font-size:10px;
      font-weight:850;
      line-height:1.45;
      text-align:center;
      padding:14px;
    }

    .vaultProfileName{
      font-size:30px;
      font-weight:950;
      letter-spacing:-.8px;
      line-height:1.05;
    }

    .vaultProfileBio{
      max-width:430px;
      margin:7px auto 0;

      color:#8c9792;

      font-size:11px;
      line-height:1.5;
    }

    .vaultMetrics{
      display:grid;
      grid-template-columns:
        repeat(3,minmax(0,1fr));

      gap:8px;

      margin-top:14px;
    }

    .vaultMetric{
      border:1px solid #242d31;
      border-radius:14px;
      background:#101518;

      padding:11px;
    }

    .vaultMetric small{
      display:block;
      color:#707b76;
      font-size:8px;
      font-weight:850;
      text-transform:uppercase;
      margin-bottom:4px;
    }

    .vaultMetric b{
      font-size:15px;
    }

    .vaultProfileActions{
      display:flex;
      justify-content:center;
      flex-wrap:wrap;
      gap:7px;

      margin-top:13px;
    }

    .vaultAction{
      border:1px solid #2a3539;
      border-radius:12px;

      background:#141a1d;
      color:#fff;

      padding:10px 13px;

      font-size:10px;
      font-weight:900;
    }

    .vaultAction.primary{
      background:#eef8f1;
      border-color:#eef8f1;
      color:#07120a;
    }

    .vaultAction.friend{
      background:#16251d;
      border-color:#2d4a38;
      color:#b8ecc7;
    }


    /* ======================================================
       PROFILE SECTIONS
       ====================================================== */

    .vaultSection{
      margin-top:24px;
    }

    .vaultSectionHead{
      display:flex;
      align-items:flex-end;
      justify-content:space-between;

      margin-bottom:9px;
    }

    .vaultSectionHead h2{
      margin:0;
      font-size:18px;
      letter-spacing:-.3px;
    }

    .vaultSectionHead span{
      color:#75807b;
      font-size:9px;
    }

    .vaultPills{
      display:flex;
      flex-wrap:wrap;
      gap:6px;
    }

    .vaultPill{
      padding:6px 9px;

      border-radius:999px;
      border:1px solid #293338;

      background:#111619;
      color:#b6c1bc;

      font-size:9px;
      font-weight:850;
    }


    /* ======================================================
       FRIENDS
       ====================================================== */

    .vaultFriends{
      display:flex;
      gap:8px;
      overflow-x:auto;

      padding-bottom:5px;

      scrollbar-width:none;
      -webkit-overflow-scrolling:touch;
    }

    .vaultFriends::-webkit-scrollbar{
      display:none;
    }

    .vaultFriend{
      flex:0 0 82px;

      border:0;
      background:none;
      color:#fff;

      padding:0;
      text-align:center;
    }

    .vaultFriendImage{
      width:58px;
      height:58px;
      margin:0 auto;

      border-radius:14px;

      border:1px solid #293338;

      background:#080b0d;

      overflow:hidden;

      display:flex;
      align-items:center;
      justify-content:center;

      font-size:9px;
      font-weight:900;
    }

    .vaultFriendImage img{
      width:100%;
      height:100%;
      object-fit:cover;
    }

    .vaultFriendName{
      margin-top:5px;
      font-size:9px;
      font-weight:850;

      white-space:nowrap;
      overflow:hidden;
      text-overflow:ellipsis;
    }


    /* ======================================================
       FRIEND REQUESTS
       ====================================================== */

    .vaultRequest{
      display:grid;
      grid-template-columns:
        42px 1fr auto;

      gap:9px;
      align-items:center;

      padding:10px 0;

      border-bottom:
        1px solid #20282c;
    }

    .vaultRequest:last-child{
      border-bottom:0;
    }

    .vaultRequestAvatar{
      width:42px;
      height:42px;

      border-radius:11px;

      border:
        1px solid #293338;

      background:#080b0d;

      overflow:hidden;

      display:flex;
      align-items:center;
      justify-content:center;

      font-size:8px;
      font-weight:900;
    }

    .vaultRequestAvatar img{
      width:100%;
      height:100%;
      object-fit:cover;
    }

    .vaultRequestName{
      font-size:11px;
      font-weight:900;
    }

    .vaultRequestActions{
      display:flex;
      gap:5px;
    }

    .vaultRequestBtn{
      border:1px solid #2b3539;
      border-radius:9px;

      background:#151a1d;
      color:#fff;

      padding:7px 8px;

      font-size:8px;
      font-weight:900;
    }

    .vaultRequestBtn.accept{
      background:#eef8f1;
      border-color:#eef8f1;
      color:#07120a;
    }


    /* ======================================================
       ENTER VAULT
       ====================================================== */

    .enterVault{
      width:100%;

      margin-top:20px;

      border:1px solid #34473d;
      border-radius:18px;

      background:
        linear-gradient(
          180deg,
          #17231d,
          #101713
        );

      color:#fff;

      padding:18px;

      text-align:left;
    }

    .enterVault small{
      display:block;

      color:#88a895;

      font-size:8px;
      font-weight:900;

      letter-spacing:.75px;

      text-transform:uppercase;
    }

    .enterVault strong{
      display:block;

      margin-top:5px;

      font-size:21px;
      font-weight:950;
      letter-spacing:-.4px;
    }

    .enterVault span{
      display:block;

      margin-top:4px;

      color:#9ba9a1;

      font-size:10px;
    }


    /* ======================================================
       VAULT SCREEN
       ====================================================== */

    #caVaultPage{
      position:relative;

      max-width:900px;

      margin:0 auto;

      padding-bottom:38px;
    }

    .vaultRoomHeader{
      display:flex;
      align-items:flex-start;
      justify-content:space-between;

      gap:12px;

      margin-bottom:15px;
    }

    .vaultRoomEyebrow{
      color:#718078;

      font-size:9px;
      font-weight:900;

      letter-spacing:.8px;

      text-transform:uppercase;
    }

    .vaultRoomTitle{
      margin-top:4px;

      font-size:30px;
      font-weight:950;
      letter-spacing:-.8px;
    }

    .vaultRoomValue{
      margin-top:4px;

      color:#a5b3ab;

      font-size:11px;
    }

    .vaultExit{
      border:1px solid #293338;
      border-radius:999px;

      background:#111619;
      color:#fff;

      padding:9px 12px;

      font-size:9px;
      font-weight:900;
    }


    /* ======================================================
       FEATURED SHELF
       ====================================================== */

    .vaultFeatured{
      display:flex;
      gap:10px;

      overflow-x:auto;

      padding:
        2px
        2px
        17px;

      margin-bottom:5px;

      scrollbar-width:none;

      scroll-snap-type:
        x mandatory;
    }

    .vaultFeatured::-webkit-scrollbar{
      display:none;
    }

    .vaultFeaturedCard{
      flex:0 0 220px;
      scroll-snap-align:start;

      border:0;
      background:none;
      color:#fff;
      text-align:left;

      padding:0;
    }

    .vaultFeaturedFrame{
      height:300px;

      padding:9px;

      border-radius:20px;

      border:1px solid #39473f;

      background:
        radial-gradient(
          circle at 50% 15%,
          #18221d,
          #080b0d 72%
        );

      display:flex;
      align-items:center;
      justify-content:center;

      overflow:hidden;

      box-shadow:
        0 16px 35px rgba(0,0,0,.25);
    }

    .vaultFeaturedFrame img{
      width:100%;
      height:100%;

      object-fit:contain;
    }

    .vaultFeaturedLabel{
      margin-top:8px;

      font-size:12px;
      font-weight:900;
    }

    .vaultFeaturedValue{
      margin-top:3px;

      color:#aebbb4;

      font-size:10px;
      font-weight:850;
    }


    /* ======================================================
       VAULT CONTROLS
       ====================================================== */

    .vaultControls{
      display:flex;

      gap:7px;

      overflow-x:auto;

      margin:
        8px
        0
        13px;

      scrollbar-width:none;
    }

    .vaultControls::-webkit-scrollbar{
      display:none;
    }

    .vaultSort{
      flex:0 0 auto;

      border:1px solid #283237;
      border-radius:999px;

      background:#101518;
      color:#7e8a84;

      padding:8px 11px;

      font-size:9px;
      font-weight:900;
    }

    .vaultSort.active{
      background:#eef8f1;
      border-color:#eef8f1;
      color:#07120a;
    }


    /* ======================================================
       VAULT WALL
       ====================================================== */

    .vaultWall{
      display:grid;

      grid-template-columns:
        repeat(2,minmax(0,1fr));

      gap:
        17px
        10px;
    }

    .vaultWallCard{
      border:0;

      background:none;
      color:#fff;

      padding:0;

      text-align:left;
    }

    .vaultWallFrame{
      position:relative;

      aspect-ratio:3/4;

      padding:8px;

      border-radius:17px;

      border:1px solid #273136;

      background:
        linear-gradient(
          180deg,
          #101619,
          #080b0d
        );

      display:flex;
      align-items:center;
      justify-content:center;

      overflow:hidden;
    }

    .vaultWallFrame img{
      width:100%;
      height:100%;

      object-fit:contain;

      display:block;
    }

    .vaultOwnedBadge{
      position:absolute;

      left:8px;
      bottom:8px;

      padding:4px 6px;

      border-radius:999px;

      background:
        rgba(8,11,13,.86);

      border:
        1px solid #35423c;

      color:#b7e9c5;

      font-size:7px;
      font-weight:950;

      -webkit-backdrop-filter:
        blur(10px);

      backdrop-filter:
        blur(10px);
    }

    .vaultWallName{
      margin-top:7px;

      font-size:11px;
      font-weight:900;

      line-height:1.3;
    }

    .vaultWallMeta{
      margin-top:3px;

      color:#75807b;

      font-size:8px;
      line-height:1.35;
    }

    .vaultWallValue{
      margin-top:5px;

      font-size:14px;
      font-weight:950;
    }


    /* ======================================================
       DISCOVER COLLECTORS
       ====================================================== */

    .vaultSearch{
      display:grid;

      grid-template-columns:
        1fr auto;

      gap:7px;

      margin-top:9px;
    }

    .vaultSearch .input{
      margin-top:0;
    }

    .vaultSearch button{
      border:0;

      border-radius:13px;

      background:#eef8f1;
      color:#07120a;

      padding:0 14px;

      font-weight:900;
    }

    .vaultCollectors{
      display:grid;

      grid-template-columns:
        repeat(2,minmax(0,1fr));

      gap:8px;

      margin-top:10px;
    }

    .vaultCollector{
      border:1px solid #263035;
      border-radius:14px;

      background:#101518;
      color:#fff;

      padding:10px;

      text-align:left;
    }

    .vaultCollectorTop{
      display:grid;

      grid-template-columns:
        42px 1fr;

      gap:8px;

      align-items:center;
    }

    .vaultCollectorAvatar{
      width:42px;
      height:42px;

      border-radius:11px;

      border:1px solid #293338;

      background:#080b0d;

      overflow:hidden;

      display:flex;
      align-items:center;
      justify-content:center;

      font-size:8px;
      font-weight:900;
    }

    .vaultCollectorAvatar img{
      width:100%;
      height:100%;
      object-fit:cover;
    }

    .vaultCollectorName{
      font-size:11px;
      font-weight:900;
    }

    .vaultCollectorMeta{
      margin-top:3px;

      color:#7e8984;

      font-size:8px;
    }


    @media(min-width:700px){

      .vaultWall{
        grid-template-columns:
          repeat(3,minmax(0,1fr));
      }

      .vaultCollectors{
        grid-template-columns:
          repeat(3,minmax(0,1fr));
      }

    }

    @media(max-width:390px){

      .vaultMetrics{
        grid-template-columns:
          repeat(2,minmax(0,1fr));
      }

      .vaultSignature{
        width:165px;
        height:225px;
      }

      .vaultFeaturedCard{
        flex-basis:200px;
      }

      .vaultFeaturedFrame{
        height:275px;
      }

    }

  `;

  document.head.appendChild(
    style
  );


  /* ==========================================================
     HELPERS
     ========================================================== */

  const esc =
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


  const money =
    value => {

      const n =
        Number(value);

      if (
        !Number.isFinite(n)
      ) {
        return '—';
      }

      return new Intl.NumberFormat(
        'en-US',
        {
          style:'currency',
          currency:'USD',
          maximumFractionDigits:
            Math.abs(n) < 100
              ? 2
              : 0
        }
      ).format(n);

    };


  const arr =
    value =>
      Array.isArray(value)
        ? value
        : [];


  function profileId(
    p
  ) {
    return (
      p?.user_id ||
      p?.id ||
      null
    );
  }


  function profileSince(
    p
  ) {
    return (
      p?.member_since ||
      p?.created_at ||
      null
    );
  }


  function vaultValue(){

    return STATE.vault.reduce(
      (sum,row) =>
        sum +
        (
          Number(
            row.position_value
          ) || 0
        ),
      0
    );

  }


  function hideCorePages(){

    [
      'portfolio',
      'add',
      'goose',
      'watchlist',
      'flips',
      'caProfilePage',
      'caSocialProfilePage',
      'caVaultPage'
    ]
      .forEach(
        id =>
          document
            .getElementById(id)
            ?.classList.add(
              'hidden'
            )
      );


    document
      .querySelectorAll(
        '#nav button'
      )
      .forEach(
        b =>
          b.classList.remove(
            'active'
          )
      );

  }


  function returnPortfolio(){

    document
      .getElementById(
        'caSocialProfilePage'
      )
      ?.classList.add(
        'hidden'
      );


    document
      .getElementById(
        'caVaultPage'
      )
      ?.classList.add(
        'hidden'
      );


    view(
      'portfolio'
    );


    window.scrollTo({
      top:0,
      behavior:'smooth'
    });

  }


  /* ==========================================================
     CREATE SOCIAL PAGES
     ========================================================== */

  const app =
    document.querySelector(
      '.app'
    );


  let profilePage =
    document.getElementById(
      'caSocialProfilePage'
    );


  if(!profilePage){

    profilePage =
      document.createElement(
        'section'
      );

    profilePage.id =
      'caSocialProfilePage';

    profilePage.className =
      'hidden';

    app?.appendChild(
      profilePage
    );

  }


  let vaultPage =
    document.getElementById(
      'caVaultPage'
    );


  if(!vaultPage){

    vaultPage =
      document.createElement(
        'section'
      );

    vaultPage.id =
      'caVaultPage';

    vaultPage.className =
      'hidden';

    app?.appendChild(
      vaultPage
    );

  }


  /* ==========================================================
     DATA LOADERS
     ========================================================== */

  async function loadProfile(
    userId
  ){

    const [
      profileRows,
      vaultRows,
      friendSummary,
      friends
    ] =
      await Promise.all([

        api(
          '/rest/v1/rpc/get_public_profile_v1',
          {
            method:'POST',

            body:JSON.stringify({
              p_user_id:userId
            })
          }
        ),

        api(
          '/rest/v1/rpc/get_public_vault_v1',
          {
            method:'POST',

            body:JSON.stringify({
              p_user_id:userId
            })
          }
        ),

        api(
          '/rest/v1/rpc/friend_summary_v1',
          {
            method:'POST',

            body:JSON.stringify({
              p_user_id:userId
            })
          }
        ),

        api(
          '/rest/v1/rpc/list_friends_v1',
          {
            method:'POST',

            body:JSON.stringify({
              p_user_id:userId
            })
          }
        )

      ]);


    STATE.profile =
      Array.isArray(
        profileRows
      )
        ? profileRows[0] || null
        : null;


    STATE.vault =
      Array.isArray(
        vaultRows
      )
        ? vaultRows
        : [];


    STATE.relationship =
      friendSummary ||
      {
        friend_count:0,
        mutual_friend_count:0,
        relationship_status:'none'
      };


    STATE.friends =
      Array.isArray(
        friends
      )
        ? friends
        : [];


    STATE.currentUserId =
      userId;


    if(
      userId === uid()
    ){

      STATE.requests =
        await api(
          '/rest/v1/rpc/list_friend_requests_v1',
          {
            method:'POST',
            body:JSON.stringify({})
          }
        )
          .catch(
            () => []
          );

    }else{

      STATE.requests = [];

    }

  }


  async function searchCollectors(
    query = ''
  ){

    STATE.collectors =
      await api(
        '/rest/v1/rpc/list_public_profiles_v1',
        {
          method:'POST',

          body:JSON.stringify({
            p_query:
              query || null,

            p_limit:50
          })
        }
      )
        .catch(
          () => []
        );

  }


  /* ==========================================================
     FRIEND ACTIONS
     ========================================================== */

  async function sendFriendRequest(){

    await api(
      '/rest/v1/rpc/send_friend_request_v1',
      {
        method:'POST',

        body:JSON.stringify({
          p_other_user_id:
            STATE.currentUserId
        })
      }
    );


    await openSocialProfile(
      STATE.currentUserId
    );

  }


  async function respondFriend(
    friendshipId,
    accept
  ){

    await api(
      '/rest/v1/rpc/respond_friend_request_v1',
      {
        method:'POST',

        body:JSON.stringify({
          p_friendship_id:
            friendshipId,

          p_accept:
            !!accept
        })
      }
    );


    await openSocialProfile(
      uid()
    );

  }


  async function removeFriend(){

    if(
      !confirm(
        'Remove this collector from your friends?'
      )
    ){
      return;
    }


    await api(
      '/rest/v1/rpc/remove_friend_v1',
      {
        method:'POST',

        body:JSON.stringify({
          p_other_user_id:
            STATE.currentUserId
        })
      }
    );


    await openSocialProfile(
      STATE.currentUserId
    );

  }


  /* ==========================================================
     RELATIONSHIP BUTTON
     ========================================================== */

  function relationshipButton(){

    if(
      STATE.currentUserId ===
      uid()
    ){

      return '';

    }


    const rel =
      STATE.relationship || {};


    if(
      rel.relationship_status ===
      'accepted'
    ){

      return `
        <button
          id="vaultFriendButton"
          class="
            vaultAction
            friend
          "
        >
          Friends ✓
        </button>
      `;

    }


    if(
      rel.relationship_status ===
      'pending' &&
      rel.relationship_direction ===
      'outgoing'
    ){

      return `
        <button
          class="vaultAction"
          disabled
        >
          Request sent
        </button>
      `;

    }


    if(
      rel.relationship_status ===
      'pending' &&
      rel.relationship_direction ===
      'incoming'
    ){

      return `
        <button
          id="vaultAcceptIncoming"
          class="
            vaultAction
            primary
          "
        >
          Accept friend
        </button>
      `;

    }


    return `
      <button
        id="vaultFriendButton"
        class="
          vaultAction
          friend
        "
      >
        Add Friend
      </button>
    `;

  }


  /* ==========================================================
     FRIEND LIST HTML
     ========================================================== */

  function friendsHtml(){

    if(
      !STATE.friends.length
    ){

      return `
        <div
          class="muted"
          style="
            font-size:10px;
            padding:7px 0;
          "
        >
          No friends yet.
        </div>
      `;

    }


    return `
      <div
        class="vaultFriends"
      >

        ${
          STATE.friends
            .map(
              friend => `
                <button
                  class="vaultFriend"
                  data-vault-friend="${
                    esc(
                      friend.user_id
                    )
                  }"
                >

                  <div
                    class="vaultFriendImage"
                  >

                    ${
                      friend.avatar_image_url
                        ? `
                          <img
                            src="${
                              esc(
                                friend
                                  .avatar_image_url
                              )
                            }"
                            alt="Friend"
                          >
                        `
                        : 'CA'
                    }

                  </div>


                  <div
                    class="vaultFriendName"
                  >
                    ${
                      esc(
                        friend.display_name ||
                        'Collector'
                      )
                    }
                  </div>

                </button>
              `
            )
            .join('')
        }

      </div>
    `;

  }


  /* ==========================================================
     FRIEND REQUESTS HTML
     ========================================================== */

  function requestsHtml(){

    if(
      STATE.currentUserId !==
        uid() ||
      !STATE.requests.length
    ){

      return '';

    }


    return `
      <div
        class="vaultSection"
      >

        <div
          class="vaultSectionHead"
        >
          <h2>
            Friend requests
          </h2>

          <span>
            ${
              STATE.requests.length
            }
          </span>
        </div>


        <div class="card">

          ${
            STATE.requests
              .map(
                req => `
                  <div
                    class="vaultRequest"
                  >

                    <div
                      class="vaultRequestAvatar"
                    >
                      ${
                        req.avatar_image_url
                          ? `
                            <img
                              src="${
                                esc(
                                  req
                                    .avatar_image_url
                                )
                              }"
                              alt="Request"
                            >
                          `
                          : 'CA'
                      }
                    </div>


                    <div
                      class="vaultRequestName"
                    >
                      ${
                        esc(
                          req.display_name ||
                          'Collector'
                        )
                      }
                    </div>


                    <div
                      class="vaultRequestActions"
                    >

                      <button
                        class="
                          vaultRequestBtn
                          accept
                        "
                        data-vault-accept="${
                          esc(
                            req.friendship_id
                          )
                        }"
                      >
                        Accept
                      </button>


                      <button
                        class="vaultRequestBtn"
                        data-vault-decline="${
                          esc(
                            req.friendship_id
                          )
                        }"
                      >
                        Decline
                      </button>

                    </div>

                  </div>
                `
              )
              .join('')
          }

        </div>

      </div>
    `;

  }


  /* ==========================================================
     END CHUNK 1
     Paste Chunk 2 directly underneath.
     ========================================================== */
