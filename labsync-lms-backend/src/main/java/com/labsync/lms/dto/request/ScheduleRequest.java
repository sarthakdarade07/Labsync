package com.labsync.lms.dto.request;

import jakarta.validation.constraints.NotNull;

/**
 * ScheduleRequest DTO — payload for manually creating a schedule entry.
 */
public class ScheduleRequest {
    @NotNull
    private Long batchId;
    @NotNull
    private Long subjectId;
    private Long staffId;
    @NotNull
    private Long labId;
    @NotNull
    private Long dayId;
    @NotNull
    private String startTime;
    @NotNull
    private String endTime;

    public ScheduleRequest() {
    }

    public Long getBatchId() {
        return this.batchId;
    }

    public Long getSubjectId() {
        return this.subjectId;
    }

    public Long getStaffId() {
        return this.staffId;
    }

    public Long getLabId() {
        return this.labId;
    }

    public Long getDayId() {
        return this.dayId;
    }

    public String getStartTime() {
        return this.startTime;
    }

    public String getEndTime() {
        return this.endTime;
    }

    public void setBatchId(final Long batchId) {
        this.batchId = batchId;
    }

    public void setSubjectId(final Long subjectId) {
        this.subjectId = subjectId;
    }

    public void setStaffId(final Long staffId) {
        this.staffId = staffId;
    }

    public void setLabId(final Long labId) {
        this.labId = labId;
    }

    public void setDayId(final Long dayId) {
        this.dayId = dayId;
    }

    public void setStartTime(final String startTime) {
        this.startTime = startTime;
    }

    public void setEndTime(final String endTime) {
        this.endTime = endTime;
    }

    @java.lang.Override
    public boolean equals(final java.lang.Object o) {
        if (o == this) return true;
        if (!(o instanceof ScheduleRequest)) return false;
        final ScheduleRequest other = (ScheduleRequest) o;
        if (!other.canEqual((java.lang.Object) this)) return false;
        final java.lang.Object this$batchId = this.getBatchId();
        final java.lang.Object other$batchId = other.getBatchId();
        if (this$batchId == null ? other$batchId != null : !this$batchId.equals(other$batchId)) return false;
        final java.lang.Object this$subjectId = this.getSubjectId();
        final java.lang.Object other$subjectId = other.getSubjectId();
        if (this$subjectId == null ? other$subjectId != null : !this$subjectId.equals(other$subjectId)) return false;
        final java.lang.Object this$staffId = this.getStaffId();
        final java.lang.Object other$staffId = other.getStaffId();
        if (this$staffId == null ? other$staffId != null : !this$staffId.equals(other$staffId)) return false;
        final java.lang.Object this$labId = this.getLabId();
        final java.lang.Object other$labId = other.getLabId();
        if (this$labId == null ? other$labId != null : !this$labId.equals(other$labId)) return false;
        final java.lang.Object this$dayId = this.getDayId();
        final java.lang.Object other$dayId = other.getDayId();
        if (this$dayId == null ? other$dayId != null : !this$dayId.equals(other$dayId)) return false;
        final java.lang.Object this$startTime = this.getStartTime();
        final java.lang.Object other$startTime = other.getStartTime();
        if (this$startTime == null ? other$startTime != null : !this$startTime.equals(other$startTime)) return false;
        final java.lang.Object this$endTime = this.getEndTime();
        final java.lang.Object other$endTime = other.getEndTime();
        if (this$endTime == null ? other$endTime != null : !this$endTime.equals(other$endTime)) return false;
        return true;
    }

    protected boolean canEqual(final java.lang.Object other) {
        return other instanceof ScheduleRequest;
    }

    @java.lang.Override
    public int hashCode() {
        final int PRIME = 59;
        int result = 1;
        final java.lang.Object $batchId = this.getBatchId();
        result = result * PRIME + ($batchId == null ? 43 : $batchId.hashCode());
        final java.lang.Object $subjectId = this.getSubjectId();
        result = result * PRIME + ($subjectId == null ? 43 : $subjectId.hashCode());
        final java.lang.Object $staffId = this.getStaffId();
        result = result * PRIME + ($staffId == null ? 43 : $staffId.hashCode());
        final java.lang.Object $labId = this.getLabId();
        result = result * PRIME + ($labId == null ? 43 : $labId.hashCode());
        final java.lang.Object $dayId = this.getDayId();
        result = result * PRIME + ($dayId == null ? 43 : $dayId.hashCode());
        final java.lang.Object $startTime = this.getStartTime();
        result = result * PRIME + ($startTime == null ? 43 : $startTime.hashCode());
        final java.lang.Object $endTime = this.getEndTime();
        result = result * PRIME + ($endTime == null ? 43 : $endTime.hashCode());
        return result;
    }

    @java.lang.Override
    public java.lang.String toString() {
        return "ScheduleRequest(batchId=" + this.getBatchId() + ", subjectId=" + this.getSubjectId() + ", staffId=" + this.getStaffId() + ", labId=" + this.getLabId() + ", dayId=" + this.getDayId() + ", startTime=" + this.getStartTime() + ", endTime=" + this.getEndTime() + ")";
    }
}
