// ─── Roles ───
export type Role = 'ADMIN' | 'MANAGER' | 'COUNSELOR' | 'AFFILIATE' | 'USER' | 'MENTOR' | 'TELECALLER';

// ─── Lead Enums (matches backend Status.java exactly) ───
export type LeadStatus =
    | 'TELECALLER_ASSIGNED'
    | 'QUALIFIED'
    | 'COUNSELOR_ASSIGNED'
    | 'EXTERNAL_ASSIGNED'
    | 'ADMISSION_IN_PROCESS'
    | 'ADMISSION_DONE'

    | 'UNASSIGNED'
    | 'CONTACTED'
    | 'INTERESTED'
    | 'TIMED_OUT'
    | 'REASSIGNED'
    | 'IN_A_SESSION'
    | 'QUEUED'
    | 'FAKE'
    | 'APPLICANT_PENDING'
    | 'APPLICANT';
    
export type LeadScore = 'HOT' | 'WARM' | 'COLD' | 'INTERESTED' | 'DISCARDED';



// ─── Counselor Enums (matches backend exactly) ───
export type CounselorStatus = 'AVAILABLE' | 'ON_LEAVE' | 'UNAVAILABLE' | 'SUSPENDED' | 'BUSY' | 'SESSION_ASSIGNED';
export type CounselorType = 'INTERNAL' | 'TELECALLER' | 'EXTERNAL';
export type Priority = 'HIGH' | 'MEDIUM' | 'LOW';

// ─── Affiliate Enums ───
export type AffiliateActive = 'ACTIVE' | 'DEACTIVE';

// ─── DTOs ───

export interface UserDTO {
    id: string | number;
    name: string;
    email: string;
    role: Role;
    isActive?: string;
    status?: string;
    createdAt?: string;
}

export interface LoginResponse {
    token: string;
    user: UserDTO;
}

// Matches backend Counselor_DTO.java exactly
export interface CounselorDTO {
    counselorId: string | number;
    name: string;
    email: string;
    phone: string[];
    password?: string;         // @JsonProperty WRITE_ONLY
    departments: string[];
    status: CounselorStatus;
    counselorTypes: CounselorType[];
    priority: Priority;
    totalLeads: number;
}

// Matches backend Lead_Response_DTO.java
export interface LeadResponseDTO {
    id: string;
    name: string;
    email: string;
    address: string;
    phone: string;
    phones?: string[];
    course?: string | { id: number; course: string };   // backend can return string or entity
    intake?: string;
    status: LeadStatus;
    campaign?: { id: number; name: string };   // backend returns Campaigns entity

    timedOutAt?: string;
    score?: LeadScore;
    createdAt?: string;

    // Fake Lead archival details
    originalLeadId?: string;
    archivedByEmail?: string;
    archivedAt?: string;
    reason?: string;
    courseName?: string;
}

// Matches backend Lead_Request_DTO.java
export interface LeadRequestDTO {
    name: string;
    email: string;
    address: string;
    phone?: string;
    phones?: string[];
    course?: string;
    intake?: string;
    status?: LeadStatus;

    campaign?: { id?: number; name: string };
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

export interface NoteDTO {
    noteId: number;
    note: string;
    createdAt: string;
    authorName?: string;
    authorRole?: string;
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
    counselorId: string | number;
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


// ─── System Config ───

/** GET /api/config response shape */
export interface ConfigDTO {
    maxCapacity: number;
    slaHours: number;
}

/** PATCH /api/config/slaHours/{hours} response shape */
export interface SlaUpdateResponseDTO {
    slaHours: number;
    activeTimersAdjusted: number;
    message: string;
}

/** PATCH /api/config/maxCapacity/{value} response shape */
export interface MaxCapacityUpdateResponseDTO {
    maxCapacity: number;
    message?: string;
}

export interface StudentRegistrationRequest {
    fullName: string;
    email: string;
    mobileNumber: string;
    dateOfBirth: string;
    gender?: string;
    address: string;
    course: string;
    schoolCollegeName: string;
    fatherName: string;
    fatherOccupation: string;
    motherName: string;
    motherOccupation: string;
    tenthPercentage: number;
    twelfthPercentage: number;
    createdByStaffId?: string;
}

export interface Student {
    id: string;
    fullName: string;
    email: string;
    mobileNumber: string;
    dateOfBirth: string;
    gender: string;
    address: string;
    course: string;
    schoolCollegeName: string;
    fatherName: string;
    motherName: string;
    tenthPercentage: number;
    twelfthPercentage: number;
    createdAt: string;
    updatedAt: string;
}

export interface LeadFilters {
    email: string;
    status: string;
    course: string;
    campaign: string;

    id?: string;
    phone?: string;
    name?: string;
    startDate?: string;
    endDate?: string;
}
