// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title ComplaintBox
 * @dev Decentralized, tamper-proof anonymous complaint filing system.
 * Designed in compliance with the IEEE 830 Software Requirements Specification (SRS).
 *
 * Core Guarantees:
 * 1. Anonymity / Pseudonymity: Submitter wallet address is never stored in contract state.
 * 2. Immutability: Once submitted, complaint text and categories cannot be altered or deleted.
 * 3. Authority Control: Only the designated admin address can update complaint statuses and append responses.
 * 4. Auditability: Emits transparent, verifiable events on the blockchain for all state transitions.
 */
contract ComplaintBox {
    // ---------------------------------------------------------
    // Type Definitions
    // ---------------------------------------------------------

    enum Status {
        Submitted,   // 0: Initial state upon student submission
        UnderReview, // 1: Authority is investigating the issue
        Resolved,    // 2: Corrective actions taken and finalized
        Rejected     // 3: Invalid or out-of-scope report
    }

    struct Complaint {
        uint256 id;
        string category;
        string description;
        uint256 timestamp;
        Status status;
        string adminResponse;
    }

    // ---------------------------------------------------------
    // State Variables
    // ---------------------------------------------------------

    /// @notice The authoritative address permitted to review and resolve complaints.
    address public admin;

    /// @notice Monotonically increasing counter of total submitted complaints.
    uint256 public complaintCount;

    /// @notice Maximum allowed character length for categories.
    uint256 public constant MAX_CATEGORY_LENGTH = 100;

    /// @notice Maximum allowed character length for descriptions to limit excessive gas usage.
    uint256 public constant MAX_DESCRIPTION_LENGTH = 2000;

    /// @dev Internal mapping from complaint ID to Complaint struct.
    mapping(uint256 => Complaint) private complaints;

    // ---------------------------------------------------------
    // Events (SRS Section 5.4)
    // ---------------------------------------------------------

    /// @notice Emitted whenever a student submits a new complaint.
    event ComplaintSubmitted(
        uint256 indexed id,
        string category,
        uint256 timestamp
    );

    /// @notice Emitted whenever the admin updates a complaint's status and response.
    event StatusUpdated(
        uint256 indexed id,
        Status status,
        string response,
        uint256 timestamp
    );

    // ---------------------------------------------------------
    // Modifiers (SRS Section 5.5 - SC-1)
    // ---------------------------------------------------------

    /// @dev Restricts invocation strictly to the contract admin.
    modifier onlyAdmin() {
        require(msg.sender == admin, "ComplaintBox: Caller is not the admin");
        _;
    }

    // ---------------------------------------------------------
    // Constructor
    // ---------------------------------------------------------

    /**
     * @dev Initializes contract deployer as the initial system administrator.
     */
    constructor() {
        admin = msg.sender;
    }

    // ---------------------------------------------------------
    // External Write Functions (SRS Section 5.3)
    // ---------------------------------------------------------

    /**
     * @notice Submits a new anonymous complaint into the system.
     * @dev Does not record msg.sender anywhere in storage to protect student privacy.
     * @param category The area/department of concern (e.g. Academic, Hostel, Harassment, Infrastructure).
     * @param description Detailed text of the complaint.
     * @return newComplaintId The unique identifier generated for tracking.
     */
    function submitComplaint(
        string calldata category,
        string calldata description
    ) external returns (uint256 newComplaintId) {
        bytes memory categoryBytes = bytes(category);
        bytes memory descriptionBytes = bytes(description);

        require(categoryBytes.length > 0, "ComplaintBox: Category cannot be empty");
        require(categoryBytes.length <= MAX_CATEGORY_LENGTH, "ComplaintBox: Category exceeds maximum length");
        require(descriptionBytes.length > 0, "ComplaintBox: Description cannot be empty");
        require(descriptionBytes.length <= MAX_DESCRIPTION_LENGTH, "ComplaintBox: Description exceeds maximum length");

        complaintCount++;
        newComplaintId = complaintCount;

        complaints[newComplaintId] = Complaint({
            id: newComplaintId,
            category: category,
            description: description,
            timestamp: block.timestamp,
            status: Status.Submitted,
            adminResponse: ""
        });

        emit ComplaintSubmitted(newComplaintId, category, block.timestamp);
    }

    /**
     * @notice Updates the lifecycle status of a complaint and appends an official response.
     * @dev Only callable by the verified admin. Original complaint text remains untouched.
     * @param id The target complaint ID.
     * @param newStatus The updated lifecycle status (UnderReview, Resolved, Rejected).
     * @param response The authority's official explanation or update note.
     */
    function updateStatus(
        uint256 id,
        Status newStatus,
        string calldata response
    ) external onlyAdmin {
        require(id > 0 && id <= complaintCount, "ComplaintBox: Complaint ID does not exist");
        require(newStatus != Status.Submitted, "ComplaintBox: Cannot revert status back to Submitted");

        Complaint storage complaint = complaints[id];
        complaint.status = newStatus;
        complaint.adminResponse = response;

        emit StatusUpdated(id, newStatus, response, block.timestamp);
    }

    // ---------------------------------------------------------
    // External View Functions (SRS Section 5.3)
    // ---------------------------------------------------------

    /**
     * @notice Retrieves detailed data for a specific complaint by ID.
     * @param id The complaint ID to query.
     */
    function getComplaint(uint256 id) external view returns (Complaint memory) {
        require(id > 0 && id <= complaintCount, "ComplaintBox: Complaint ID does not exist");
        return complaints[id];
    }

    /**
     * @notice Returns all complaints currently registered in the system.
     * @dev Used by public complaint list and admin dashboard views.
     */
    function getAllComplaints() external view returns (Complaint[] memory) {
        Complaint[] memory list = new Complaint[](complaintCount);
        for (uint256 i = 1; i <= complaintCount; i++) {
            list[i - 1] = complaints[i];
        }
        return list;
    }

    /**
     * @notice Calculates aggregated metrics across all complaints.
     * @return total Total number of complaints registered.
     * @return pending Complaints awaiting review (Status.Submitted).
     * @return underReview Complaints actively being addressed (Status.UnderReview).
     * @return resolved Complaints successfully addressed (Status.Resolved).
     * @return rejected Complaints dismissed (Status.Rejected).
     */
    function getStats()
        external
        view
        returns (
            uint256 total,
            uint256 pending,
            uint256 underReview,
            uint256 resolved,
            uint256 rejected
        )
    {
        total = complaintCount;
        for (uint256 i = 1; i <= complaintCount; i++) {
            Status s = complaints[i].status;
            if (s == Status.Submitted) {
                pending++;
            } else if (s == Status.UnderReview) {
                underReview++;
            } else if (s == Status.Resolved) {
                resolved++;
            } else if (s == Status.Rejected) {
                rejected++;
            }
        }
    }
}

