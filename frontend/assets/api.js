// Configuration API
const API_BASE =
  window.GENIDOC_CONFIG?.apiBaseUrl ||
  localStorage.getItem("genidoc_api_base_url") ||
  `${window.location.origin}/api`;

class API {
  constructor() {
    this.token = localStorage.getItem("token");
  }

  getHeaders() {
    return {
      "Content-Type": "application/json",
      ...(this.token && { Authorization: `Bearer ${this.token}` }),
    };
  }

  // PATIENTS
  async registerPatient(data) {
    return fetch(`${API_BASE}/patients/register`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    }).then((r) => r.json());
  }

  async loginPatient(email, password) {
    return fetch(`${API_BASE}/patients/login`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify({ email, password }),
    }).then((r) => r.json());
  }

  async getProfile() {
    return fetch(`${API_BASE}/patients/profile`, {
      headers: this.getHeaders(),
    }).then((r) => r.json());
  }

  async updateProfile(data) {
    return fetch(`${API_BASE}/patients/profile`, {
      method: "PUT",
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    }).then((r) => r.json());
  }

  async getAllPatients() {
    return fetch(`${API_BASE}/patients`, {
      headers: this.getHeaders(),
    }).then((r) => r.json());
  }

  // DOCTORS
  async getAllDoctors() {
    return fetch(`${API_BASE}/doctors`, {
      headers: this.getHeaders(),
    }).then((r) => r.json());
  }

  async getDoctorById(id) {
    return fetch(`${API_BASE}/doctors/${id}`, {
      headers: this.getHeaders(),
    }).then((r) => r.json());
  }

  async getDoctorAvailability(id) {
    return fetch(`${API_BASE}/doctors/${id}/availability`, {
      headers: this.getHeaders(),
    }).then((r) => r.json());
  }

  // APPOINTMENTS
  async createAppointment(data) {
    return fetch(`${API_BASE}/appointments`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    }).then((r) => r.json());
  }

  async getMyAppointments() {
    return fetch(`${API_BASE}/appointments/my-appointments`, {
      headers: this.getHeaders(),
    }).then((r) => r.json());
  }

  async getAppointmentById(id) {
    return fetch(`${API_BASE}/appointments/${id}`, {
      headers: this.getHeaders(),
    }).then((r) => r.json());
  }

  async confirmAppointment(id) {
    return fetch(`${API_BASE}/appointments/${id}/confirm`, {
      method: "PUT",
      headers: this.getHeaders(),
    }).then((r) => r.json());
  }

  async cancelAppointment(id) {
    return fetch(`${API_BASE}/appointments/${id}`, {
      method: "DELETE",
      headers: this.getHeaders(),
    }).then((r) => r.json());
  }

  async getAvailableAppointments(date) {
    return fetch(
      `${API_BASE}/appointments/available?appointment_date=${date}`,
      {
        headers: this.getHeaders(),
      },
    ).then((r) => r.json());
  }

  async getDoctorAppointments(doctorId) {
    return fetch(`${API_BASE}/appointments/doctor/${doctorId}`, {
      headers: this.getHeaders(),
    }).then((r) => r.json());
  }

  // MEDICAL RECORDS
  async createMedicalRecord(data) {
    return fetch(`${API_BASE}/medical-records`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    }).then((r) => r.json());
  }

  async getMyMedicalRecords() {
    return fetch(`${API_BASE}/medical-records/my-records`, {
      headers: this.getHeaders(),
    }).then((r) => r.json());
  }

  async getMedicalRecordById(id) {
    return fetch(`${API_BASE}/medical-records/${id}`, {
      headers: this.getHeaders(),
    }).then((r) => r.json());
  }

  async updateMedicalRecord(id, data) {
    return fetch(`${API_BASE}/medical-records/${id}`, {
      method: "PUT",
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    }).then((r) => r.json());
  }

  async getMedicalRecordByAppointment(appointmentId) {
    return fetch(`${API_BASE}/medical-records/appointment/${appointmentId}`, {
      headers: this.getHeaders(),
    }).then((r) => r.json());
  }

  setToken(token) {
    this.token = token;
    localStorage.setItem("token", token);
  }

  getToken() {
    return this.token;
  }

  logout() {
    this.token = null;
    localStorage.removeItem("token");
  }
}

const api = new API();
