import { card, mkBtn } from "../lib/uiUtils";

export const GameMechanicsPage = ({ navigate }) => {
  return (
    <div style={{ maxWidth:860, margin:"0 auto" }}>
      <h2 style={{ margin:"0 0 1.25rem", fontFamily:"var(--display)", color:"#d4af37", fontSize:22 }}>Game Mechanics</h2>
      <p style={{ color:"#9fb4d6", fontSize:13, lineHeight:1.7, marginBottom:"1.5rem" }}>
        Everything you need to know about how Nationwheel works — from nations and actions to wars, diplomacy, and the world assembly.
      </p>

      <div style={{ display:"flex", flexDirection:"column", gap:"1.25rem" }}>

        {/* Nations */}
        <section style={card}>
          <h3 style={{ margin:"0 0 0.75rem", fontFamily:"var(--display)", color:"#d4af37", fontSize:16 }}>Nations</h3>
          <p style={{ color:"#d7e2f2", fontSize:13, lineHeight:1.8, margin:0 }}>
            Every registered player belongs to a nation. Nations are the core unit of the game world. Each nation has:
          </p>
          <ul style={{ color:"#b8c4d8", fontSize:13, lineHeight:1.8, paddingLeft:"1.25rem", margin:"0.5rem 0 0" }}>
            <li><strong style={{ color:"#edf4ff" }}>Stats</strong> — Population, GDP, land area, army rank, HDI, and economy type. These are set by Lore Team and change through actions.</li>
            <li><strong style={{ color:"#edf4ff" }}>Profile</strong> — Bio, flag, diplomatic status, and bloc. Nation leaders can edit these.</li>
            <li><strong style={{ color:"#edf4ff" }}>Owner</strong> — Each nation has a player assigned as its Nation Leader. This is handled by Lore Team through the admin panel.</li>
          </ul>
        </section>

        {/* Roles */}
        <section style={card}>
          <h3 style={{ margin:"0 0 0.75rem", fontFamily:"var(--display)", color:"#d4af37", fontSize:16 }}>Roles & Permissions</h3>
          <div style={{ display:"flex", flexDirection:"column", gap:"0.75rem" }}>
            {[
              { role:"Admin", color:"#e74c3c", desc:"Complete control over every mechanic. Can manage roles, moderate everything, edit all content, and access all admin tools." },
              { role:"Lore Team", color:"#3498db", desc:"Manages the game world. Can edit any nation's profile and stats, moderate forums, manage news, approve/reject/counter-propose actions, edit alliances, and assign nations to players." },
              { role:"Nation Leader", color:"#d4af37", desc:"Assigned when a player receives a nation. Can edit their nation's profile (bio, flag, diplomatic status, bloc), form alliances, request to join alliances, send direct messages to other leaders, and view alliance boards." },
              { role:"Alliance Leader", color:"#2ecc71", desc:"Secondary role assigned by other alliance leaders. Can approve/reject join requests, create and manage alliance boards, and assign other alliance leaders." },
              { role:"User", color:"#8fa0bd", desc:"Default role for all registered players. Can participate in forums, post dispatches, submit actions, and view the world." },
            ].map(({ role, color, desc }) => (
              <div key={role} style={{ display:"flex", gap:"0.75rem", alignItems:"flex-start" }}>
                <span style={{ fontSize:11, fontWeight:800, color:"#0a0806", background:color, borderRadius:4, padding:"2px 10px", whiteSpace:"nowrap", letterSpacing:"0.04em" }}>{role.toUpperCase()}</span>
                <span style={{ color:"#b8c4d8", fontSize:13, lineHeight:1.7 }}>{desc}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Dispatches */}
        <section style={card}>
          <h3 style={{ margin:"0 0 0.75rem", fontFamily:"var(--display)", color:"#d4af37", fontSize:16 }}>Dispatches (RP Posts)</h3>
          <p style={{ color:"#d7e2f2", fontSize:13, lineHeight:1.8, margin:0 }}>
            Dispatches are the primary way to tell your nation's story. Types include:
          </p>
          <ul style={{ color:"#b8c4d8", fontSize:13, lineHeight:1.8, paddingLeft:"1.25rem", margin:"0.5rem 0 0" }}>
            <li><strong style={{ color:"#edf4ff" }}>Dispatch</strong> — General news or world-building from your nation.</li>
            <li><strong style={{ color:"#edf4ff" }}>Official Statement</strong> — Formal government announcements.</li>
            <li><strong style={{ color:"#edf4ff" }}>Declaration</strong> — Major proclamations or policy changes.</li>
            <li><strong style={{ color:"#edf4ff" }}>Intelligence</strong> — Covert or public intelligence reports.</li>
            <li><strong style={{ color:"#edf4ff" }}>Propaganda</strong> — State media and messaging.</li>
            <li><strong style={{ color:"#edf4ff" }}>Treaty Proposal</strong> — Public offers to other nations.</li>
            <li><strong style={{ color:"#edf4ff" }}>Ultimatum</strong> — Final demands with consequences.</li>
          </ul>
          <p style={{ color:"#9fb4d6", fontSize:12, lineHeight:1.7, margin:"0.5rem 0 0" }}>
            You can target dispatches at specific nations to create directed storylines. Use @mentions to notify other players.
          </p>
        </section>

        {/* Actions */}
        <section style={card}>
          <h3 style={{ margin:"0 0 0.75rem", fontFamily:"var(--display)", color:"#d4af37", fontSize:16 }}>Canon Actions</h3>
          <p style={{ color:"#d7e2f2", fontSize:13, lineHeight:1.8, margin:0 }}>
            Actions represent substantive changes to your nation or the world. They require Lore Team approval to become canon.
          </p>
          <ul style={{ color:"#b8c4d8", fontSize:13, lineHeight:1.8, paddingLeft:"1.25rem", margin:"0.5rem 0 0" }}>
            <li><strong style={{ color:"#edf4ff" }}>Small</strong> — Minor changes (1 day estimated).</li>
            <li><strong style={{ color:"#edf4ff" }}>Medium</strong> — Moderate changes (3 days).</li>
            <li><strong style={{ color:"#edf4ff" }}>Large</strong> — Significant changes (7 days).</li>
            <li><strong style={{ color:"#edf4ff" }}>Major</strong> — World-altering changes (14 days).</li>
            <li><strong style={{ color:"#edf4ff" }}>Epic</strong> — Campaign-defining changes (21 days).</li>
          </ul>
          <p style={{ color:"#9fb4d6", fontSize:12, lineHeight:1.7, margin:"0.5rem 0 0" }}>
            Lore Team can approve, reject, or counter-propose actions. Counter-proposals suggest edits instead of outright rejection. Once approved, actions progress and can be updated with status reports.
          </p>
        </section>

        {/* Wars */}
        <section style={card}>
          <h3 style={{ margin:"0 0 0.75rem", fontFamily:"var(--display)", color:"#d4af37", fontSize:16 }}>Wars</h3>
          <p style={{ color:"#d7e2f2", fontSize:13, lineHeight:1.8, margin:0 }}>
            Wars are conflicts between nations or alliances. Any Nation Leader can declare war, specifying a target, casus belli, and expected outcome.
          </p>
          <ul style={{ color:"#b8c4d8", fontSize:13, lineHeight:1.8, paddingLeft:"1.25rem", margin:"0.5rem 0 0" }}>
            <li><strong style={{ color:"#edf4ff" }}>Active</strong> — Ongoing conflict.</li>
            <li><strong style={{ color:"#edf4ff" }}>Ceasefire</strong> — Temporary halt, can be violated.</li>
            <li><strong style={{ color:"#edf4ff" }}>Frozen</strong> — Inactive but not formally ended.</li>
            <li><strong style={{ color:"#edf4ff" }}>Peace</strong> — Formally concluded.</li>
          </ul>
          <p style={{ color:"#9fb4d6", fontSize:12, lineHeight:1.7, margin:"0.5rem 0 0" }}>
            War participants track each side's involvement. The outcome is decided through RP and mutual agreement, or by Lore Team intervention.
          </p>
        </section>

        {/* Alliances */}
        <section style={card}>
          <h3 style={{ margin:"0 0 0.75rem", fontFamily:"var(--display)", color:"#d4af37", fontSize:16 }}>Alliances & Pacts</h3>
          <p style={{ color:"#d7e2f2", fontSize:13, lineHeight:1.8, margin:0 }}>
            Alliances are formal groupings of nations. Types include:
          </p>
          <ul style={{ color:"#b8c4d8", fontSize:13, lineHeight:1.8, paddingLeft:"1.25rem", margin:"0.5rem 0 0" }}>
            <li><strong style={{ color:"#edf4ff" }}>Alliance</strong> — Full mutual defense and cooperation pact.</li>
            <li><strong style={{ color:"#edf4ff" }}>Trade Pact</strong> — Economic cooperation and trade agreements.</li>
            <li><strong style={{ color:"#edf4ff" }}>Defence Pact</strong> — Military defense commitment.</li>
            <li><strong style={{ color:"#edf4ff" }}>Non-Aggression Pact</strong> — Agreement not to attack each other.</li>
          </ul>
          <p style={{ color:"#9fb4d6", fontSize:12, lineHeight:1.7, margin:"0.5rem 0 0" }}>
            Nation Leaders can request to join existing alliances. Alliance leaders can approve or reject requests. Each alliance has private discussion boards visible only to members. Alliances also have leaders who can manage the group.
          </p>
        </section>

        {/* Diplomacy & Treaties */}
        <section style={card}>
          <h3 style={{ margin:"0 0 0.75rem", fontFamily:"var(--display)", color:"#d4af37", fontSize:16 }}>Diplomacy & Treaties</h3>
          <p style={{ color:"#d7e2f2", fontSize:13, lineHeight:1.8, margin:0 }}>
            Treaties are formal bilateral or multilateral agreements between nations. They are distinct from alliances — any two nations can sign a treaty regardless of alliance membership.
          </p>
          <ul style={{ color:"#b8c4d8", fontSize:13, lineHeight:1.8, paddingLeft:"1.25rem", margin:"0.5rem 0 0" }}>
            <li><strong style={{ color:"#edf4ff" }}>Non-Aggression Pact</strong> — Both parties agree not to attack each other.</li>
            <li><strong style={{ color:"#edf4ff" }}>Trade Agreement</strong> — Economic benefits and trade route establishment.</li>
            <li><strong style={{ color:"#edf4ff" }}>Defense Pact</strong> — Mutual defense if either party is attacked.</li>
            <li><strong style={{ color:"#edf4ff" }}>Military Alliance</strong> — Full military cooperation and coordination.</li>
            <li><strong style={{ color:"#edf4ff" }}>Economic Union</strong> — Deep economic integration and shared markets.</li>
          </ul>
          <p style={{ color:"#9fb4d6", fontSize:12, lineHeight:1.7, margin:"0.5rem 0 0" }}>
            Treaties can be proposed by any Nation Leader, ratified by the other party, and cancelled with a notice period. Treaties affect diplomatic relations and may trigger war involvement.
          </p>
        </section>

        {/* World Assembly */}
        <section style={card}>
          <h3 style={{ margin:"0 0 0.75rem", fontFamily:"var(--display)", color:"#d4af37", fontSize:16 }}>World Assembly</h3>
          <p style={{ color:"#d7e2f2", fontSize:13, lineHeight:1.8, margin:0 }}>
            The World Assembly is a global body where all nations have a voice. Members can propose resolutions, vote on matters of international concern, and shape the global order.
          </p>
          <ul style={{ color:"#b8c4d8", fontSize:13, lineHeight:1.8, paddingLeft:"1.25rem", margin:"0.5rem 0 0" }}>
            <li><strong style={{ color:"#edf4ff" }}>Proposals</strong> — Any member nation can submit a resolution for debate and voting.</li>
            <li><strong style={{ color:"#edf4ff" }}>Voting</strong> — Each nation gets one vote. Proposals pass with a majority.</li>
            <li><strong style={{ color:"#edf4ff" }}>Resolutions</strong> — Passed proposals become binding resolutions that affect the game world.</li>
            <li><strong style={{ color:"#edf4ff" }}>Sanctions</strong> — The Assembly can impose economic or diplomatic sanctions on nations.</li>
          </ul>
        </section>

        {/* Economy */}
        <section style={card}>
          <h3 style={{ margin:"0 0 0.75rem", fontFamily:"var(--display)", color:"#d4af37", fontSize:16 }}>Economy & Resources</h3>
          <p style={{ color:"#d7e2f2", fontSize:13, lineHeight:1.8, margin:0 }}>
            Nations track several resource categories that power their economy and military:
          </p>
          <ul style={{ color:"#b8c4d8", fontSize:13, lineHeight:1.8, paddingLeft:"1.25rem", margin:"0.5rem 0 0" }}>
            <li><strong style={{ color:"#edf4ff" }}>Food</strong> — Sustains your population. Food shortages can lead to instability.</li>
            <li><strong style={{ color:"#edf4ff" }}>Minerals</strong> — Raw materials for industry and construction.</li>
            <li><strong style={{ color:"#edf4ff" }}>Energy</strong> — Powers your nation's industry and technology.</li>
            <li><strong style={{ color:"#edf4ff" }}>Tech</strong> — Research and development capability.</li>
            <li><strong style={{ color:"#edf4ff" }}>Manpower</strong> — Population available for military and labor.</li>
          </ul>
          <p style={{ color:"#9fb4d6", fontSize:12, lineHeight:1.7, margin:"0.5rem 0 0" }}>
            Resources are produced based on your nation's stats and can be traded with other nations via trade routes. GDP is calculated from your resource production and trade activity. Use the Economy & Trade page to manage your nation's economic development.
          </p>
        </section>

        {/* Forum */}
        <section style={card}>
          <h3 style={{ margin:"0 0 0.75rem", fontFamily:"var(--display)", color:"#d4af37", fontSize:16 }}>Forums</h3>
          <p style={{ color:"#d7e2f2", fontSize:13, lineHeight:1.8, margin:0 }}>
            The forum system is the primary hub for out-of-character discussion, diplomacy, and coordination. Boards cover topics from general chat and diplomacy to war strategy and lore. Key features:
          </p>
          <ul style={{ color:"#b8c4d8", fontSize:13, lineHeight:1.8, paddingLeft:"1.25rem", margin:"0.5rem 0 0" }}>
            <li>Thread creation with rich BBCode formatting (bold, lists, quotes, spoilers, and more).</li>
            <li>Post signatures — both text and image — that appear below your forum posts.</li>
            <li>Canon/non-canon tagging by Lore Team for world-building posts.</li>
            <li>Reactions (emojis) on posts.</li>
            <li>@mentions to notify other players.</li>
          </ul>
        </section>

        {/* In-Game Calendar */}
        <section style={card}>
          <h3 style={{ margin:"0 0 0.75rem", fontFamily:"var(--display)", color:"#d4af37", fontSize:16 }}>In-Game Calendar</h3>
          <p style={{ color:"#d7e2f2", fontSize:13, lineHeight:1.8, margin:0 }}>
            The game world runs on its own calendar (currently Day 44, 4488). Each in-game day represents a passage of time in the RP world. Lore Team can advance the calendar as needed to reflect the passage of time, cooldowns for actions, and seasonal events. The current date is displayed in the footer and staff tools bar.
          </p>
        </section>

        {/* Direct Messages */}
        <section style={card}>
          <h3 style={{ margin:"0 0 0.75rem", fontFamily:"var(--display)", color:"#d4af37", fontSize:16 }}>Direct Messages</h3>
          <p style={{ color:"#d7e2f2", fontSize:13, lineHeight:1.8, margin:0 }}>
            Nation Leaders have access to a private inbox system for direct communication with other leaders. This is ideal for diplomatic negotiations, secret agreements, and coordination. Messages include subject lines and read receipts. The inbox is accessible from the Wars & Alliances page.
          </p>
        </section>

        {/* Economy */}
        <section style={card}>
          <h3 style={{ margin:"0 0 0.75rem", fontFamily:"var(--display)", color:"#d4af37", fontSize:16 }}>Notifications</h3>
          <p style={{ color:"#d7e2f2", fontSize:13, lineHeight:1.8, margin:0 }}>
            The notification bell in the header alerts you to important events: when someone mentions you (@username) in a forum post or dispatch, when a thread you're involved in gets a reply, when wars involving your nation are declared, and when your action's status changes. The bell shows an unread count, and clicking a notification marks it as read.
          </p>
        </section>

        {/* Getting Started */}
        <section style={{ ...card, border:"1px solid rgba(212,175,55,0.28)" }}>
          <h3 style={{ margin:"0 0 0.75rem", fontFamily:"var(--display)", color:"#d4af37", fontSize:16 }}>Getting Started</h3>
          <ol style={{ color:"#b8c4d8", fontSize:13, lineHeight:2, paddingLeft:"1.25rem", margin:0 }}>
            <li><strong style={{ color:"#edf4ff" }}>Register</strong> — Create an account and set up your profile.</li>
            <li><strong style={{ color:"#edf4ff" }}>Get a Nation</strong> — Lore Team will assign you a nation. You'll become its Nation Leader.</li>
            <li><strong style={{ color:"#edf4ff" }}>Introduce Yourself</strong> — Post in the Nation Introductions forum board.</li>
            <li><strong style={{ color:"#edf4ff" }}>Set Up Your Nation</strong> — Edit your nation's profile, upload a flag, and set your diplomatic status.</li>
            <li><strong style={{ color:"#edf4ff" }}>Start RPing</strong> — Post dispatches, submit actions, and engage with the world.</li>
            <li><strong style={{ color:"#edf4ff" }}>Build Alliances</strong> — Form or join alliances, sign treaties, and establish trade routes.</li>
            <li><strong style={{ color:"#edf4ff" }}>Participate</strong> — Vote in the World Assembly, join wars, and help shape the story.</li>
          </ol>
        </section>
      </div>
    </div>
  );
};
