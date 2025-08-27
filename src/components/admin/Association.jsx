import axios from "axios";
import { useEffect, useState } from "react";
import toast, { Toaster } from "react-hot-toast";

export default function Association() {
  const [listeassociations, setlisteassociations] = useState([]);
  const [filtre, setFiltre] = useState("toutes");
  const [selectedAssociation, setSelectedAssociation] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAssociations = async () => {
      try {
        const res = await axios.get("http://127.0.0.1:8000/api/association-with-users/");
        if (res.status === 200) {
          setlisteassociations(res.data);
        }
      } catch (error) {
        console.error(error);
        toast.error("Erreur lors du chargement des associations");
      } finally {
        setLoading(false);
      }
    };

    fetchAssociations();
  }, []);

  const associationsFiltrees = listeassociations.filter((a) => {
    const matchesFilter =
      filtre === "attente" ? a.user.is_active === false :
      filtre === "valide" ? a.user.is_active === true : true;

    const matchesSearch =
      searchTerm === "" || a.nom.toLowerCase().includes(searchTerm);

    return matchesFilter && matchesSearch;
  });

  const activeroudesactivercompte = async (idass) => {
    try {
      const res = await axios.get(`http://127.0.0.1:8000/api/activer-ou-desactiver-Association/${idass}`);
      if (res.status === 200) {
        setlisteassociations(prev =>
          prev.map(a => a.id === idass ? { ...a, user: { ...a.user, is_active: !a.user.is_active } } : a)
        );
        toast.success("Statut modifié avec succès");
      }
    } catch (error) {
      console.error(error);
      toast.error("Erreur lors de la modification du statut");
    }
  };

  const showAssociationDetails = (association) => setSelectedAssociation(association);
  const closeDetails = () => setSelectedAssociation(null);

  return (
    <div className="association-container">
      <Toaster position="top-right" />

      {selectedAssociation && (
        <div className="association-modal">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Détails de l'association</h2>
              <button className="close-button" onClick={closeDetails}>×</button>
            </div>
            <div className="detail-item">
              <p className="detail-label">Nom</p>
              <p className="detail-value">{selectedAssociation.nom}</p>
            </div>
            <div className="detail-item">
              <p className="detail-label">Description</p>
              <p className="detail-value">{selectedAssociation.description}</p>
            </div>
            <div className="detail-item">
              <p className="detail-label">Email</p>
              <p className="detail-value">{selectedAssociation.user.email}</p>
            </div>
            <div className="detail-item">
              <p className="detail-label">Statut</p>
              <span className={`status-badge ${selectedAssociation.user.is_active ? 'active' : 'inactive'}`}>
                {selectedAssociation.user.is_active ? "Validée" : "En attente"}
              </span>
            </div>
          </div>
        </div>
      )}

      <div className="header-section">
        <div>
          <h1>Liste des Associations</h1>
          <p>Gérez et validez les associations de la plateforme</p>
        </div>
        <div className="search-container">
          <input
            type="text"
            placeholder="Rechercher par nom..."
            onChange={(e) => setSearchTerm(e.target.value.toLowerCase())}
          />
          <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      <div className="filter-buttons">
        <button className={`filter-btn ${filtre === "attente" ? 'active' : ''}`} onClick={() => setFiltre("attente")}>
          En attente ({listeassociations.filter(a => !a.user.is_active).length})
        </button>
        <button className={`filter-btn ${filtre === "valide" ? 'active' : ''}`} onClick={() => setFiltre("valide")}>
          Validées ({listeassociations.filter(a => a.user.is_active).length})
        </button>
        <button className={`filter-btn ${filtre === "toutes" ? 'active' : ''}`} onClick={() => setFiltre("toutes")}>
          Toutes ({listeassociations.length})
        </button>
      </div>

      <div className="table-container">
        {loading ? (
          <div className="loading-spinner">Chargement...</div>
        ) : associationsFiltrees.length > 0 ? (
          <table>
            <thead>
              <tr>
                <th>Association</th>
                <th>Description</th>
                <th>Email</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {associationsFiltrees.map((a, idx) => (
                <tr key={idx}>
                  <td>{a.nom}</td>
                  <td>{a.description}</td>
                  <td className="email-cell">{a.user.email}</td>
                  <td>
                    <span className={`status-badge ${a.user.is_active ? 'active' : 'inactive'}`}>
                      {a.user.is_active ? "Validée" : "En attente"}
                    </span>
                  </td>
                  <td className="action-buttons">
                    <button className="view-btn" onClick={() => showAssociationDetails(a)}>👁️</button>
                    <button
                      className={`toggle-btn ${a.user.is_active ? 'deactivate' : 'activate'}`}
                      onClick={() => activeroudesactivercompte(a.id)}
                    >
                      {a.user.is_active ? "Désactiver" : "Activer"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="no-results">Aucune association trouvée</div>
        )}
      </div>

      <style jsx>{`
        .association-container { max-width: 95%; margin: 0 auto; padding: 32px 24px; background: #fff; border-radius: 16px; font-family: 'Inter', sans-serif; box-shadow: 0 8px 20px rgba(0,0,0,0.05); }
        .header-section { display:flex; justify-content:space-between; align-items:center; margin-bottom:32px; }
        .header-section h1 { font-size:28px; font-weight:700; color:#111827; margin-bottom:8px; }
        .header-section p { font-size:16px; color:#374151; margin:0; }
        .search-container { position: relative; width: 350px; }
        .search-container input { width:100%; padding:12px 16px 12px 40px; border-radius:12px; border:1px solid #d1d5db; font-size:14px; outline:none; }
        .search-icon { position:absolute; left:12px; top:50%; transform:translateY(-50%); color:#9ca3af; width:20px; height:20px; }
        .filter-buttons { display:flex; gap:16px; margin-bottom:24px; padding-bottom:16px; border-bottom:1px solid #e5e7eb; }
        .filter-btn { padding:8px 20px; border-radius:12px; background:#f3f4f6; color:#374151; border:none; font-weight:600; cursor:pointer; }
        .filter-btn.active { background-color:#6366f1; color:#fff; }
        .table-container { background:#fff; border-radius:16px; overflow:hidden; box-shadow:0 4px 12px rgba(0,0,0,0.05); border:1px solid #e5e7eb; overflow-x:auto; }
        table { width:100%; border-collapse:collapse; min-width:800px; }
        th { padding:16px 24px; text-align:left; font-size:14px; font-weight:600; color:#6b7280; background:#f9fafb; border-bottom:1px solid #e5e7eb; }
        td { padding:16px 24px; font-size:14px; border-bottom:1px solid #e5e7eb; color:#111827; }
        .email-cell { color:#6366f1; font-weight:500; }
        .status-badge { padding:4px 8px; border-radius:8px; font-size:12px; font-weight:500; }
        .status-badge.active { background:#dcfce7; color:#166534; }
        .status-badge.inactive { background:#fef3c7; color:#92400e; }
        .action-buttons { display:flex; gap:8px; justify-content:flex-end; }
        .view-btn { padding:6px 12px; border-radius:8px; background:#f3f4f6; border:none; cursor:pointer; }
        .toggle-btn { padding:8px 16px; border-radius:12px; color:#fff; border:none; font-weight:600; cursor:pointer; }
        .toggle-btn.activate { background:#10b981; }
        .toggle-btn.deactivate { background:#ef4444; }
        .loading-spinner, .no-results { padding:32px; text-align:center; color:#6b7280; }
        .association-modal { position:fixed; top:0; left:0; right:0; bottom:0; background:rgba(0,0,0,0.4); display:flex; align-items:center; justify-content:center; z-index:1000; }
        .modal-content { background:#fff; border-radius:16px; padding:32px 24px; width:500px; max-width:90%; box-shadow:0 8px 20px rgba(0,0,0,0.12); }
        .modal-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:24px; }
        .modal-header h2 { font-size:22px; font-weight:700; color:#111827; }
        .close-button { background:none; border:none; cursor:pointer; font-size:22px; color:#9ca3af; }
        .close-button:hover { color:#374151; }
        .detail-item { margin-bottom:18px; }
        .detail-label { font-size:14px; color:#6b7280; margin-bottom:4px; }
        .detail-value { font-size:16px; color:#111827; font-weight:500; }
      `}</style>
    </div>
  );
}
