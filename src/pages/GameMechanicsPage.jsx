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
            Nations track five resource categories that power their economy and military. All resources are calculated from your nation's core stats — population, land area, GDP, HDI, army rank, government type, and economy sector.
          </p>

          <h4 style={{ margin:"1rem 0 0.5rem", fontFamily:"var(--display)", color:"#f6c132", fontSize:14 }}>Resource Formulas</h4>
          <p style={{ color:"#9fb4d6", fontSize:12, lineHeight:1.7, margin:"0 0 0.75rem" }}>
            Every resource calculation starts from three fundamental factors derived from your nation's stats:
          </p>
          <div style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(78,128,190,0.2)", borderRadius:6, padding:"0.75rem 1rem", marginBottom:"0.75rem" }}>
            <code style={{ display:"block", color:"#99dca7", fontSize:12, lineHeight:1.8 }}>
              PF = √population ÷ 100  &nbsp;(Population Factor)<br/>
              LF = √land_km² ÷ 100  &nbsp;(Land Factor)<br/>
              GF = log₁₀(GDP ÷ 1e9 + 1)  &nbsp;(GDP Factor)<br/>
              hdiAdj = 1 − (HDI − 0.5) × 0.15  &nbsp;(HDI Adjustment)<br/>
              hdiBonus = 1 + (HDI − 0.5) × 0.3  &nbsp;(HDI Bonus)
            </code>
          </div>

          <div style={{ display:"flex", flexDirection:"column", gap:"0.5rem", marginBottom:"0.75rem" }}>
            <div style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(78,128,190,0.2)", borderRadius:6, padding:"0.75rem 1rem" }}>
              <strong style={{ color:"#edf4ff", fontSize:13 }}>Manpower</strong>
              <code style={{ display:"block", color:"#99dca7", fontSize:12, lineHeight:1.8, marginTop:"0.3rem" }}>
                PF × 10 × GOV_MULT × (1 + army_rank × 0.08) × hdiAdj
              </code>
              <p style={{ color:"#9fb4d6", fontSize:11, lineHeight:1.6, margin:"0.3rem 0 0" }}>
                Affected by government type — militaristic regimes produce more manpower. Each army rank gives +8% bonus. Higher HDI reduces available manpower (fewer people available for conscription in developed nations).
              </p>
            </div>
            <div style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(78,128,190,0.2)", borderRadius:6, padding:"0.75rem 1rem" }}>
              <strong style={{ color:"#edf4ff", fontSize:13 }}>Food</strong>
              <code style={{ display:"block", color:"#99dca7", fontSize:12, lineHeight:1.8, marginTop:"0.3rem" }}>
                max(0, LF × 10 × ECO_food × hdiBonus + GF × 30 − PF × 1.5)
              </code>
              <p style={{ color:"#9fb4d6", fontSize:11, lineHeight:1.6, margin:"0.3rem 0 0" }}>
                Agriculture-based economies produce more food. Higher HDI boosts food production. Each unit of population consumes 1.5 food — large populations require massive agricultural output to avoid starvation.
              </p>
            </div>
            <div style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(78,128,190,0.2)", borderRadius:6, padding:"0.75rem 1rem" }}>
              <strong style={{ color:"#edf4ff", fontSize:13 }}>Minerals</strong>
              <code style={{ display:"block", color:"#99dca7", fontSize:12, lineHeight:1.8, marginTop:"0.3rem" }}>
                max(5, LF × 8 × ECO_min + GF × 20)
              </code>
              <p style={{ color:"#9fb4d6", fontSize:11, lineHeight:1.6, margin:"0.3rem 0 0" }}>
                Mining, heavy industry, and resource-extraction economies produce the most minerals. Minimum floor of 5 ensures every nation has some base output.
              </p>
            </div>
            <div style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(78,128,190,0.2)", borderRadius:6, padding:"0.75rem 1rem" }}>
              <strong style={{ color:"#edf4ff", fontSize:13 }}>Energy</strong>
              <code style={{ display:"block", color:"#99dca7", fontSize:12, lineHeight:1.8, marginTop:"0.3rem" }}>
                max(5, PF × 5 × ECO_ene + GF × 15)
              </code>
              <p style={{ color:"#9fb4d6", fontSize:11, lineHeight:1.6, margin:"0.3rem 0 0" }}>
                Driven by population and industrial economy types. Manufacturing, energy sectors, and tech-heavy economies produce the most energy.
              </p>
            </div>
            <div style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(78,128,190,0.2)", borderRadius:6, padding:"0.75rem 1rem" }}>
              <strong style={{ color:"#edf4ff", fontSize:13 }}>Tech</strong>
              <code style={{ display:"block", color:"#99dca7", fontSize:12, lineHeight:1.8, marginTop:"0.3rem" }}>
                max(1, PF × 3 × HDI × 2 × ECO_tech)
              </code>
              <p style={{ color:"#9fb4d6", fontSize:11, lineHeight:1.6, margin:"0.3rem 0 0" }}>
                Heavily weighted by HDI — developed nations produce far more tech. Innovation, AI, robotics, and cybernetics economies lead in tech output.
              </p>
            </div>
            <div style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(78,128,190,0.2)", borderRadius:6, padding:"0.75rem 1rem" }}>
              <strong style={{ color:"#edf4ff", fontSize:13 }}>GDP (Display)</strong>
              <code style={{ display:"block", color:"#99dca7", fontSize:12, lineHeight:1.8, marginTop:"0.3rem" }}>
                round(nominal_GDP_usd)
              </code>
              <p style={{ color:"#9fb4d6", fontSize:11, lineHeight:1.6, margin:"0.3rem 0 0" }}>
                Displayed in full USD with abbreviating suffixes (T/B/M). Nominal GDP is calculated as population × 500 by default, or set manually by Lore Team.
              </p>
            </div>
          </div>

          <h4 style={{ margin:"1rem 0 0.5rem", fontFamily:"var(--display)", color:"#f6c132", fontSize:14 }}>Government Type Multipliers</h4>
          <p style={{ color:"#9fb4d6", fontSize:12, lineHeight:1.7, margin:"0 0 0.5rem" }}>
            Government type affects <strong style={{ color:"#edf4ff" }}>manpower production only</strong>. Militaristic regimes produce more manpower; decentralized or pacifist governments produce less.
          </p>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0.35rem", marginBottom:"0.75rem", fontSize:12 }}>
            {[
              ["2.0×", "Military Dictatorship, Junta, Stratocracy"],
              ["1.8×", "Colony — Military Govt"],
              ["1.5×", "Fascist Empire, Expansionist Republic"],
              ["1.2–1.3×", "Empire, Monarchy, Kingdom, Federal Empire, Cybernetic Regency"],
              ["1.0×", "Republic, Democracy, Constitutional Monarchy, Socialist Republic"],
              ["0.8–0.9×", "Technocracy, Corporate Confederation, Trade Empire, Progressive Union"],
              ["0.6–0.7×", "Crypto-Anarchy, Pirate Confederation, Protectorate"],
              ["0.5×", "Fallen Empire"],
            ].map(([mult, types]) => (
              <div key={mult} style={{ background:"rgba(255,255,255,0.03)", borderRadius:4, padding:"0.35rem 0.6rem", display:"flex", gap:"0.5rem", alignItems:"baseline" }}>
                <span style={{ color:"#f6c132", fontWeight:700, whiteSpace:"nowrap", fontSize:13 }}>{mult}</span>
                <span style={{ color:"#b8c4d8", fontSize:11, lineHeight:1.5 }}>{types}</span>
              </div>
            ))}
          </div>

          <h4 style={{ margin:"1rem 0 0.5rem", fontFamily:"var(--display)", color:"#f6c132", fontSize:14 }}>Economy Sector Multipliers</h4>
          <p style={{ color:"#9fb4d6", fontSize:12, lineHeight:1.7, margin:"0 0 0.5rem" }}>
            Each economy type has unique multipliers across all four resources. Here are the peak performers:
          </p>
          <div style={{ overflowX:"auto", marginBottom:"0.75rem" }}>
            <table style={{ width:"100%", fontSize:11, borderCollapse:"collapse", color:"#b8c4d8" }}>
              <thead>
                <tr style={{ borderBottom:"1px solid rgba(78,128,190,0.25)" }}>
                  <th style={{ textAlign:"left", padding:"0.35rem 0.5rem", color:"#8fa0bd", fontWeight:600 }}>Resource</th>
                  <th style={{ textAlign:"left", padding:"0.35rem 0.5rem", color:"#8fa0bd", fontWeight:600 }}>Top Multiplier</th>
                  <th style={{ textAlign:"left", padding:"0.35rem 0.5rem", color:"#8fa0bd", fontWeight:600 }}>Best Economy Types</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom:"1px solid rgba(78,128,190,0.12)" }}>
                  <td style={{ padding:"0.35rem 0.5rem", color:"#edf4ff", fontWeight:600 }}>Food</td>
                  <td style={{ padding:"0.35rem 0.5rem", color:"#f6c132" }}>2.5×</td>
                  <td style={{ padding:"0.35rem 0.5rem" }}>Agriculture, Ranching, Fishing, Freshwater</td>
                </tr>
                <tr style={{ borderBottom:"1px solid rgba(78,128,190,0.12)" }}>
                  <td style={{ padding:"0.35rem 0.5rem", color:"#edf4ff", fontWeight:600 }}>Minerals</td>
                  <td style={{ padding:"0.35rem 0.5rem", color:"#f6c132" }}>2.5×</td>
                  <td style={{ padding:"0.35rem 0.5rem" }}>Minerals, Gems, Oil, Mining, Heavy Industry</td>
                </tr>
                <tr style={{ borderBottom:"1px solid rgba(78,128,190,0.12)" }}>
                  <td style={{ padding:"0.35rem 0.5rem", color:"#edf4ff", fontWeight:600 }}>Energy</td>
                  <td style={{ padding:"0.35rem 0.5rem", color:"#f6c132" }}>2.5×</td>
                  <td style={{ padding:"0.35rem 0.5rem" }}>Energy, Oil, Manufacturing, Space, Heavy Industry</td>
                </tr>
                <tr>
                  <td style={{ padding:"0.35rem 0.5rem", color:"#edf4ff", fontWeight:600 }}>Tech</td>
                  <td style={{ padding:"0.35rem 0.5rem", color:"#f6c132" }}>3.0×</td>
                  <td style={{ padding:"0.35rem 0.5rem" }}>Tech, Innovation, AI, Robotics, Cybernetics, Cloning</td>
                </tr>
              </tbody>
            </table>
          </div>

          <h4 style={{ margin:"1rem 0 0.5rem", fontFamily:"var(--display)", color:"#f6c132", fontSize:14 }}>Starvation</h4>
          <p style={{ color:"#d7e2f2", fontSize:13, lineHeight:1.8, margin:0 }}>
            Any nation with <strong style={{ color:"#edf4ff" }}>Food ≤ 0</strong> after resource calculation suffers the following penalties each processing cycle:
          </p>
          <ul style={{ color:"#b8c4d8", fontSize:13, lineHeight:1.8, paddingLeft:"1.25rem", margin:"0.5rem 0 0" }}>
            <li><strong style={{ color:"#e74c3c" }}>−2% population</strong> — population is multiplied by 0.98 and rounded.</li>
            <li><strong style={{ color:"#e74c3c" }}>−0.1 HDI</strong> — human development index decreases by 0.1 (minimum 0).</li>
            <li>After applying penalties, all nation resources are recalculated based on the new stats.</li>
          </ul>

          <h4 style={{ margin:"1rem 0 0.5rem", fontFamily:"var(--display)", color:"#f6c132", fontSize:14 }}>Trade Routes</h4>
          <p style={{ color:"#d7e2f2", fontSize:13, lineHeight:1.8, margin:0 }}>
            Nations can establish trade routes to transfer resources between each other. Each route specifies a resource type, amount per transfer cycle, and the sender/receiver pair. Trade routes are processed in bulk and respect the sender's available stock — if a nation does not have enough of a resource, the transfer is capped at the available amount.
          </p>

          <h4 style={{ margin:"1rem 0 0.5rem", fontFamily:"var(--display)", color:"#f6c132", fontSize:14 }}>Recalculation</h4>
          <p style={{ color:"#9fb4d6", fontSize:12, lineHeight:1.7, margin:"0.5rem 0 0" }}>
            The Lore Team can trigger a full recalculation for all nations at any time from the Admin panel. This re-calculates every nation's resources from scratch based on their current stats. Starvation and trade route processing are also triggered manually by staff.
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

        {/* Notifications */}
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
