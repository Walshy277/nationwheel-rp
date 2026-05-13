const tools = [
  ["B", "[b]", "[/b]"],
  ["I", "[i]", "[/i]"],
  ["U", "[u]", "[/u]"],
  ["S", "[s]", "[/s]"],
  ["Quote", "[quote]", "[/quote]"],
  ["Code", "[code]", "[/code]"],
  ["URL", "[url=https://example.com]", "[/url]"],
  ["Image", "[img]", "[/img]"],
  ["Spoiler", "[spoiler]", "[/spoiler]"],
  ["Center", "[center]", "[/center]"],
  ["Nation", "[mention=nation:slug]", "[/mention]"],
  ["User", "[mention=user:username]", "[/mention]"],
];

const BBCodeToolbar = ({ onInsert, mkBtn }) => (
  <div className="bbcode-toolbar">
    {tools.map(([label, open, close]) => (
      <button key={label} type="button" onClick={() => onInsert(open, close)} style={{ ...mkBtn("ghost"), minHeight:30, padding:"4px 8px", fontSize:11 }}>
        {label}
      </button>
    ))}
  </div>
);

export default BBCodeToolbar;

