/** Fields the admin API is allowed to return for an appointment.
 *  Never includes `sourceIpHash`. */
export const APPOINTMENT_ADMIN_FIELDS = {
  id: true,
  reference: true,
  name: true,
  phone: true,
  email: true,
  department: true,
  note: true,
  reasonForVisit: true,
  preferredDate: true,
  preferredTime: true,
  conversationSummary: true,
  source: true,
  status: true,
  chatSessionId: true,
  createdAt: true,
  updatedAt: true,
} as const;

export const CHAT_SESSION_ADMIN_FIELDS = {
  id: true,
  publicId: true,
  status: true,
  leadStatus: true,
  patientName: true,
  preferredDoctor: true,
  specialty: true,
  preferredDate: true,
  preferredTime: true,
  contactPhone: true,
  contactEmail: true,
  reasonForVisit: true,
  summary: true,
  emergencyFlag: true,
  createdAt: true,
  lastActivityAt: true,
} as const;

export const WHATSAPP_ADMIN_FIELDS = {
  id: true,
  template: true,
  toPhone: true,
  body: true,
  status: true,
  mode: true,
  appointmentId: true,
  chatSessionId: true,
  error: true,
  createdAt: true,
  sentAt: true,
} as const;
