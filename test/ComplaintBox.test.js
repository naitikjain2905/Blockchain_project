const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("ComplaintBox Smart Contract", function () {
  let complaintBox;
  let admin;
  let student1;
  let student2;
  let nonAdmin;

  // Status enum mapping
  const Status = {
    Submitted: 0,
    UnderReview: 1,
    Resolved: 2,
    Rejected: 3,
  };

  beforeEach(async function () {
    [admin, student1, student2, nonAdmin] = await ethers.getSigners();

    const ComplaintBoxFactory = await ethers.getContractFactory("ComplaintBox");
    complaintBox = await ComplaintBoxFactory.deploy();
    await complaintBox.waitForDeployment();
  });

  describe("1. Deployment & Access Control Initialization", function () {
    it("Should correctly initialize the deployer as the admin", async function () {
      expect(await complaintBox.admin()).to.equal(admin.address);
    });

    it("Should initialize total complaint count to zero", async function () {
      expect(await complaintBox.complaintCount()).to.equal(0n);
    });
  });

  describe("2. Complaint Submission (FR-2.1 to FR-2.6, SC-2, SC-3)", function () {
    it("Should successfully submit a complaint and emit ComplaintSubmitted event", async function () {
      const category = "Academic";
      const description = "Grading discrepancy in final examination for CS101.";

      const tx = await complaintBox.connect(student1).submitComplaint(category, description);
      await expect(tx)
        .to.emit(complaintBox, "ComplaintSubmitted")
        .withArgs(1n, category, (await ethers.provider.getBlock("latest")).timestamp);

      expect(await complaintBox.complaintCount()).to.equal(1n);

      const complaint = await complaintBox.getComplaint(1n);
      expect(complaint.id).to.equal(1n);
      expect(complaint.category).to.equal(category);
      expect(complaint.description).to.equal(description);
      expect(complaint.status).to.equal(Status.Submitted);
      expect(complaint.adminResponse).to.equal("");
    });

    it("Should increment IDs monotonically for sequential submissions", async function () {
      await complaintBox.connect(student1).submitComplaint("Hostel", "Hot water not available in Block B.");
      await complaintBox.connect(student2).submitComplaint("Infrastructure", "Projector bulb broken in Room 302.");

      expect(await complaintBox.complaintCount()).to.equal(2n);

      const c1 = await complaintBox.getComplaint(1n);
      const c2 = await complaintBox.getComplaint(2n);

      expect(c1.id).to.equal(1n);
      expect(c2.id).to.equal(2n);
      expect(c1.category).to.equal("Hostel");
      expect(c2.category).to.equal("Infrastructure");
    });

    it("Should reject submissions with empty category", async function () {
      await expect(
        complaintBox.connect(student1).submitComplaint("", "Valid description")
      ).to.be.revertedWith("ComplaintBox: Category cannot be empty");
    });

    it("Should reject submissions with empty description", async function () {
      await expect(
        complaintBox.connect(student1).submitComplaint("Academic", "")
      ).to.be.revertedWith("ComplaintBox: Description cannot be empty");
    });

    it("Should reject submissions exceeding maximum category length", async function () {
      const longCategory = "A".repeat(101);
      await expect(
        complaintBox.connect(student1).submitComplaint(longCategory, "Valid description")
      ).to.be.revertedWith("ComplaintBox: Category exceeds maximum length");
    });

    it("Should reject submissions exceeding maximum description length", async function () {
      const longDescription = "D".repeat(2001);
      await expect(
        complaintBox.connect(student1).submitComplaint("Academic", longDescription)
      ).to.be.revertedWith("ComplaintBox: Description exceeds maximum length");
    });
  });

  describe("3. Status Updates & Admin Authority (FR-5.1 to FR-5.6, SC-1)", function () {
    beforeEach(async function () {
      await complaintBox.connect(student1).submitComplaint("Harassment", "Verbal abuse near cafeteria.");
    });

    it("Should allow the admin to move status to UnderReview with response", async function () {
      const tx = await complaintBox
        .connect(admin)
        .updateStatus(1n, Status.UnderReview, "Investigation opened with campus security.");

      await expect(tx)
        .to.emit(complaintBox, "StatusUpdated")
        .withArgs(1n, Status.UnderReview, "Investigation opened with campus security.", (await ethers.provider.getBlock("latest")).timestamp);

      const complaint = await complaintBox.getComplaint(1n);
      expect(complaint.status).to.equal(Status.UnderReview);
      expect(complaint.adminResponse).to.equal("Investigation opened with campus security.");
    });

    it("Should allow the admin to move status to Resolved", async function () {
      await complaintBox
        .connect(admin)
        .updateStatus(1n, Status.Resolved, "Security footage reviewed. Action taken.");

      const complaint = await complaintBox.getComplaint(1n);
      expect(complaint.status).to.equal(Status.Resolved);
      expect(complaint.adminResponse).to.equal("Security footage reviewed. Action taken.");
    });

    it("Should allow the admin to move status to Rejected", async function () {
      await complaintBox
        .connect(admin)
        .updateStatus(1n, Status.Rejected, "Insufficient details provided to verify.");

      const complaint = await complaintBox.getComplaint(1n);
      expect(complaint.status).to.equal(Status.Rejected);
    });

    it("Should revert if a non-admin attempts to update status (SC-1)", async function () {
      await expect(
        complaintBox.connect(nonAdmin).updateStatus(1n, Status.Resolved, "Malicious attempt")
      ).to.be.revertedWith("ComplaintBox: Caller is not the admin");
    });

    it("Should revert if updating a non-existent complaint ID", async function () {
      await expect(
        complaintBox.connect(admin).updateStatus(999n, Status.Resolved, "Ghost complaint")
      ).to.be.revertedWith("ComplaintBox: Complaint ID does not exist");
    });

    it("Should revert if attempting to set status back to Submitted", async function () {
      await expect(
        complaintBox.connect(admin).updateStatus(1n, Status.Submitted, "Reverting to initial")
      ).to.be.revertedWith("ComplaintBox: Cannot revert status back to Submitted");
    });

    it("Should verify original complaint description remains immutable after status updates (SC-2)", async function () {
      const originalComplaint = await complaintBox.getComplaint(1n);

      await complaintBox
        .connect(admin)
        .updateStatus(1n, Status.Resolved, "Resolved by admin");

      const updatedComplaint = await complaintBox.getComplaint(1n);
      expect(updatedComplaint.category).to.equal(originalComplaint.category);
      expect(updatedComplaint.description).to.equal(originalComplaint.description);
      expect(updatedComplaint.timestamp).to.equal(originalComplaint.timestamp);
    });
  });

  describe("4. Queries and Aggregated Statistics (FR-3.1, FR-4.1, FR-6.1)", function () {
    beforeEach(async function () {
      // Complaint 1 -> Submitted
      await complaintBox.connect(student1).submitComplaint("Academic", "Delay in grade release");
      // Complaint 2 -> UnderReview
      await complaintBox.connect(student2).submitComplaint("Hostel", "Water leakage in washroom");
      await complaintBox.connect(admin).updateStatus(2n, Status.UnderReview, "Plumber assigned");
      // Complaint 3 -> Resolved
      await complaintBox.connect(student1).submitComplaint("Infrastructure", "Library AC broken");
      await complaintBox.connect(admin).updateStatus(3n, Status.Resolved, "AC repaired");
      // Complaint 4 -> Rejected
      await complaintBox.connect(student2).submitComplaint("Other", "Spam / test complaint");
      await complaintBox.connect(admin).updateStatus(4n, Status.Rejected, "Invalid submission");
    });

    it("Should retrieve all complaints correctly with getAllComplaints()", async function () {
      const all = await complaintBox.getAllComplaints();
      expect(all.length).to.equal(4);
      expect(all[0].category).to.equal("Academic");
      expect(all[1].category).to.equal("Hostel");
      expect(all[2].category).to.equal("Infrastructure");
      expect(all[3].category).to.equal("Other");
    });

    it("Should calculate accurate stats via getStats()", async function () {
      const stats = await complaintBox.getStats();
      expect(stats.total).to.equal(4n);
      expect(stats.pending).to.equal(1n);
      expect(stats.underReview).to.equal(1n);
      expect(stats.resolved).to.equal(1n);
      expect(stats.rejected).to.equal(1n);
    });

    it("Should revert when querying getComplaint() with out-of-range ID", async function () {
      await expect(complaintBox.getComplaint(0n)).to.be.revertedWith(
        "ComplaintBox: Complaint ID does not exist"
      );
      await expect(complaintBox.getComplaint(5n)).to.be.revertedWith(
        "ComplaintBox: Complaint ID does not exist"
      );
    });
  });
});

