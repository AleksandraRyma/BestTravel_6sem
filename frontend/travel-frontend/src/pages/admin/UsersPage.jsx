import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getUsers,
  deleteEmployee,
  updateUser,
  createEmployee,
} from "../../api/adminApi";
import DashboardLayout from "../../components/layout/DashboardLayout";
import ConfirmModal from "../../components/ConfirmModal";
import "../../styles/admin/UserPage.css";


const ROLE_OPTIONS = [
  { value: "", label: "Все роли" },
  { value: "ADMIN", label: "Админ" },
  { value: "TOUR_GUIDE", label: "Гид" },
  { value: "TRAVELER", label: "Путешественник" },
];

const STATUS_OPTIONS = [
  { value: "", label: "Все статусы" },
  { value: "ACTIVE", label: "Активный" },
  { value: "BLOCKED", label: "Заблокирован" },
];

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const [leaveModalOpen, setLeaveModalOpen] = useState(false);

  const navigate = useNavigate();

  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState(""); 


  const [formValues, setFormValues] = useState({
    fullName: "",
    email: "",
    role: "TRAVELER",
    status: "ACTIVE",
    password: "",
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await getUsers();
      setUsers(data.content || data || []);
    } finally {
      setLoading(false);
    }
  };

const filteredUsers = useMemo(() => {
  const term = searchTerm.trim().toLowerCase();
  return users.filter((u) => {
    const byRole = roleFilter ? u.role === roleFilter : true;
    const byStatus = statusFilter ? u.status === statusFilter : true;
    const bySearch = term
      ? u.fullName.toLowerCase().startsWith(term) ||
        u.email.toLowerCase().startsWith(term)
      : true;
    return byRole && byStatus && bySearch;
  });
}, [users, roleFilter, statusFilter, searchTerm]);


  const openDeleteModal = (user) => {
    setUserToDelete(user);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!userToDelete) return;
    await deleteEmployee(userToDelete.id);
    setDeleteModalOpen(false);
    setUserToDelete(null);
    loadUsers();
    setUnsavedChanges(true);
  };

  const resetForm = () => {
    setFormValues({
      fullName: "",
      email: "",
      role: "TRAVELER",
      status: "ACTIVE",
      password: "",
    });
  };

  const openEditModal = (user) => {
    setEditingUser(user);
    setFormValues({
      fullName: user.fullName || "",
      email: user.email || "",
      role: user.role || "TRAVELER",
      status: user.status || "ACTIVE",
      password: "",
    });
    setEditModalOpen(true);
  };

  const openCreateModal = () => {
    setEditingUser(null);
    resetForm();
    setCreateModalOpen(true);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveUser = async (e) => {
    e.preventDefault();
    const payload = {
      fullName: formValues.fullName,
      email: formValues.email,
      role: formValues.role,
      status: formValues.status,
      password: formValues.password || undefined,
    };

    if (editingUser) {
      await updateUser(editingUser.id, payload);
      setEditModalOpen(false);
    } else {
      await createEmployee(payload);
      setCreateModalOpen(false);
    }

    setEditingUser(null);
    resetForm();
    loadUsers();
    setUnsavedChanges(true);
  };

  const applyFilters = () => {
    // фильтрация уже считается в filteredUsers, эта функция просто триггер для UX
  };

  const resetFilters = () => {
    setRoleFilter("");
    setStatusFilter("");
    setSearchTerm("");
  };

  const handleBackToDashboard = () => {
    if (unsavedChanges) {
      setLeaveModalOpen(true);
    } else {
      navigate("/admin");
    }
  };

  const handleSaveAll = () => {
    setUnsavedChanges(false);
  };

  

  return (
    <DashboardLayout>
      <div className="users-page">
        <header className="users-header">
          <div className="users-header-top">

            <h2>Пользователи</h2>
            <button
              type="button"
              className="users-back-btn"
              onClick={handleBackToDashboard}
            >
              ← Панель администратора
            </button>
          </div>
          <p>Управление учетными записями, ролями и статусами.</p>
        </header>

        <section className="users-filters" aria-label="Фильтры пользователей">
          <div className="filters-row">
            <div className="filter-group">
              <label htmlFor="roleFilter">Роль</label>
              <select
                id="roleFilter"
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
              >
                {ROLE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label htmlFor="statusFilter">Статус</label>
              <select
                id="statusFilter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-group search-group">
  <label htmlFor="searchTerm">Поиск</label>
  <input
    type="text"
    id="searchTerm"
    placeholder="По ФИО или email..."
    value={searchTerm}
    onChange={(e) => setSearchTerm(e.target.value)}
  />
</div>


            <div className="filter-buttons">

              <button
                type="button"
                className="users-btn ghost"
                onClick={resetFilters}
              >
                Сбросить фильтр
              </button>
              <button
                type="button"
                className="users-btn primary"
                onClick={openCreateModal}
              >
                Создать пользователя
              </button>


              <button
                type="button"
                className="users-btn success"
                onClick={handleSaveAll}
                disabled={!unsavedChanges}
              >
                Сохранить все изменения
              </button>
            </div>
          </div>
        </section>

        <section className="table-section">
          <div className="table-wrapper">
            <table className="users-table">
              <thead>
                <tr>
                  <th>ФИО</th>
                  <th>Почта</th>
                  <th>Роль</th>
                  <th>Статус</th>
                  <th>Дата регистрации</th>
                  <th>Действия</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="empty-cell">
                      Загрузка...
                    </td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="empty-cell">
                      Пользователи не найдены.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => (
                    <tr
                      key={u.id}
                      onDoubleClick={() => openEditModal(u)}
                      className="user-row"
                    >
                      <td>{u.fullName}</td>
                      <td>{u.email}</td>
                      <td>{u.role}</td>
                      <td>
                        <span
                          className={`status-badge ${
                            u.status === "BLOCKED" ? "blocked" : "active"
                          }`}
                        >
                          {u.status === "BLOCKED" ? "Заблокирован" : "Активный"}
                        </span>
                      </td>
                      <td>{u.createdAt ? u.createdAt : "—"}</td>
                      <td className="action-cell">
                        <button
                          type="button"
                          className="icon-btn edit"
                          title="Редактировать"
                          onDoubleClick={() => openEditModal(u)}
                        >
                          ✏️
                        </button>
                        <button
                          type="button"
                          className="icon-btn delete"
                          title="Удалить"
                          onClick={() => openDeleteModal(u)}
                        >
                          ✕
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        <ConfirmModal
          isOpen={deleteModalOpen}
          title="Удалить пользователя"
          message={`Вы действительно хотите удалить пользователя "${userToDelete?.fullName}"? Это действие нельзя будет отменить.`}
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeleteModalOpen(false)}
        />

        <ConfirmModal
          isOpen={leaveModalOpen}
          title="Несохранённые изменения"
          message="Вы не нажали «Сохранить все изменения». Выйти без сохранения?"
          onConfirm={() => {
            setLeaveModalOpen(false);
            setUnsavedChanges(false);
            navigate("/admin");
          }}
          onCancel={() => setLeaveModalOpen(false)}
        />

        {(editModalOpen || createModalOpen) && (
          <div className="users-modal-backdrop" role="dialog" aria-modal="true">
            <div className="users-modal">
              <h3>{editingUser ? "Редактирование пользователя" : "Создание пользователя"}</h3>
              <form onSubmit={handleSaveUser} className="users-form">
                <div className="form-row">
                  <label>ФИО</label>
                  <input
                    type="text"
                    name="fullName"
                    value={formValues.fullName}
                    onChange={handleFormChange}
                    required
                  />
                </div>
                <div className="form-row">
                  <label>Почта</label>
                  <input
                    type="email"
                    name="email"
                    value={formValues.email}
                    onChange={handleFormChange}
                    required
                  />
                </div>
                <div className="form-row two-cols">
                  <div>
                    <label>Роль</label>
                    <select
                      name="role"
                      value={formValues.role}
                      onChange={handleFormChange}
                    >
                      {ROLE_OPTIONS.filter((r) => r.value).map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label>Статус</label>
                    <select
                      name="status"
                      value={formValues.status}
                      onChange={handleFormChange}
                    >
                      <option value="ACTIVE">Активный</option>
                      <option value="BLOCKED">Заблокирован</option>
                    </select>
                  </div>
                </div>
                <div className="form-row">
                  <label>Пароль</label>
                  <input
                    type="password"
                    name="password"
                    value={formValues.password}
                    onChange={handleFormChange}
                    placeholder={
                      editingUser ? "Оставьте пустым, чтобы не менять" : ""
                    }
                  />
                </div>

                <div className="modal-actions">
                  <button
                    type="button"
                    className="users-btn ghost"
                    onClick={() => {
                      setEditModalOpen(false);
                      setCreateModalOpen(false);
                      setEditingUser(null);
                      resetForm();
                    }}
                  >
                    Отмена
                  </button>
                  <button type="submit" className="users-btn primary">
                    Сохранить
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
