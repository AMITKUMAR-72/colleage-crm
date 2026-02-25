// ─── Roles ───
export type Role = 'ADMIN' | 'MANAGER' | 'COUNSELOR' | 'AFFILIATE' | 'USER' | 'MENTOR' | 'TELECALLER';

// ─── Lead Enums (matches backend Status.java exactly) ───
export type LeadStatus =
    | 'NEW'
    | 'TELECALLER_ASSIGNED'
    | 'QUALIFIED'
    | 'COUNSELOR_ASSIGNED'
    | 'EXTERNAL_ASSIGNED'
    | 'ADMISSION_IN_PROCESS'
    | 'ADMISSION_DONE'
    | 'LOST'
    | 'UNASSIGNED'
    | 'CONTACTED'
    | 'TIMED_OUT'
    | 'REASSIGNED';

// matches backend Scores.java
export type LeadScore = 'HOT' | 'WARM' | 'COLD';

// ─── Counselor Enums (matches backend exactly) ───
export type CounselorStatus = 'AVAILABLE' | 'ON_LEAVE' | 'UNAVAILABLE' | 'SUSPENDED' | 'BUSY' | 'SESSION_ASSIGNED';
export type CounselorType = 'INTERNAL' | 'TELECALLER' | 'EXTERNAL';
export type Priority = 'HIGH' | 'MEDIUM' | 'LOW';

// ─── Affiliate Enums ───
export type AffiliateActive = 'ACTIVE' | 'DEACTIVE';

// ─── DTOs ───

export interface UserDTO {
    id: number;
    name: string;
    email: string;
    role: Role;
    isActive: string; // SLA_Status enum on backend
}

export interface LoginResponse {
    token: string;
    user: UserDTO;
}

// Matches backend Counselor_DTO.java exactly
export interface CounselorDTO {
    counselorId: number;
    name: string;
    email: string;
    phone: string;
    password?: string;         // @JsonProperty WRITE_ONLY
    department: string;
    status: CounselorStatus;
    counselorType: CounselorType;
    priority: Priority;
    totalLeads: number;
}

// Matches backend Lead_Response_DTO.java
export interface LeadResponseDTO {
    id: number;
    leadId?: number;
    name: string;
    email: string;
    address: string;
    phone: string;
    course?: { id: number; course: string };   // backend returns Courses entity
    intake?: string;
    status: LeadStatus;
    campaign?: { id: number; name: string };   // backend returns Campaigns entity
    score: LeadScore;
    timedOutAt?: string;
}

// Matches backend Lead_Request_DTO.java
export interface LeadRequestDTO {
    name: string;
    email: string;
    address: string;
    phone: string;
    course?: string;
    intake?: string;
    status?: LeadStatus;
    score?: LeadScore;
    campaign?: { id: number; name: string };
}

// Matches backend Campaign_DTO.java (Source)
export interface CampaignDTO {
    id: number;
    name: string;
}

// Alias for clarity
export type SourceDTO = CampaignDTO;

// Matches backend Affiliates_DTO.java exactly
export interface AffiliateDTO {
    id: number;
    companyName: string;
    email: string;
    commissionPercent: number;
    payoutMethod: string;
    active: AffiliateActive;
    userId: number;
    createdAt: string;
}

export interface DepartmentDTO {
    id: number;
    department: string;
    courses?: CourseDTO[];
    counselors?: CounselorDTO[];
}

export interface CourseDTO {
    id: number;
    course: string;
    department: string; // Backend sends Department Name (String)
    leads?: any; // Backend has Leads entity here, likely null or ignored in list views
}

export interface RoleDTO {
    id: number;
    role: string;
}

// Matches backend Note_DTO.java exactly
export interface NoteDTO {
    noteId: number;
    note: string;
    createdAt: string;
}

// Matches backend CreateNote_Request_DTO.java
export interface CreateNoteRequestDTO {
    note: string;
}

export interface SessionDTO {
    id: number;
    sessionId?: number;
    startTime: string;
    endTime: string;
    departmentId?: number;
    department?: string;
    availableSlots?: number;
    maxCapacity?: number;
    location?: string;
    notes?: string;
    mentorId?: number;
    mentorIds?: number[];
    assignedMentors?: any[];
    status?: string;
}

export interface SessionAssignmentDTO {
    assignmentId: number;
    leadId: number;
    leadName: string;
    sessionId: number;
    counselorId: number;
    counselorName: string;
    assignedAt: string;
    notes: string;
    preferredDate: string;
}

// Paginated response from Spring Data Page
export interface PageResponse<T> {
    content: T[];
    totalPages: number;
    totalElements: number;
    number: number;  // current page
    size: number;
    first: boolean;
    last: boolean;
}

// ─── Audit Log ───

export interface DiffEntry {
    new: any;
    old: any;
}

export interface AuditLogDTO {
    id: number;
    action: string;
    entityType: string;
    entityId: string;
    oldState: Record<string, any>;
    newState: Record<string, any>;
    diff: Record<string, DiffEntry>;
    modifiedBy: string;
    role: string;
    userAgent: string;
    requestUrl: string;
    timestamp: string;
}

// ─── Manager Specific DTOs ───

export interface AssignedLeadDTO {
    id: number;
    lead: LeadResponseDTO;
    counselor: CounselorDTO;
    assignedBy: string;
    assignedAt: string;
    status: string;
}

export interface ContactedLeadDTO {
    id: number;
    lead: LeadResponseDTO;
    assignedTo: CounselorDTO;
    assignedBy: UserDTO;
    contactedAt: string;
    status: LeadStatus;
    notes?: string;
}
