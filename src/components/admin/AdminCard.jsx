const AdminCard = ({ title, children, card }) => (
  <section style={card}>
    {title && <h3 style={{ margin:"0 0 0.75rem", fontFamily:"var(--display)", color:"#d4af37", fontSize:14 }}>{title}</h3>}
    {children}
  </section>
);

export default AdminCard;

