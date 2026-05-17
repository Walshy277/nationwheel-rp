export const ProfileButton = ({ profile, onViewProfile, children, style = {} }) => {
  if (!profile?.id || !onViewProfile) return <span style={style}>{children || profile?.username || "Unknown"}</span>;
  return (
    <button
      onClick={(event) => { event.stopPropagation(); onViewProfile(profile.id); }}
      style={{ background:"transparent", border:"none", padding:0, minHeight:0, color:"inherit", cursor:"pointer", font:"inherit", textAlign:"left", ...style }}
    >
      {children || profile.username || "Unknown"}
    </button>
  );
};
