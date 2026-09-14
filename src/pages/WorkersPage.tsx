import React, { useState } from 'react';
import { PageHeader } from '../components/layout/PageHeader';
import { SummaryCard } from '../components/common/SummaryCard';
import { DataTable } from '../components/common/DataTable';
import { StatusBadge } from '../components/common/StatusBadge';
import { Button } from '../components/common/Button';
import { ConfirmationDialog } from '../components/common/ConfirmationDialog';
import { Modal } from '../components/common/Modal';
import { WorkerEditModal } from '../components/common/WorkerEditModal';
import { useNavigation } from '../context/NavigationContext';
import { useWorkers } from '../context/WorkerContext';
import { useToast } from '../context/ToastContext';
import { Worker, TableColumn } from '../types';
import { UserPlus, Eye, Trash2, Edit3, UserCheck, UserX, Clock, Users } from 'lucide-react';

export const WorkersPage: React.FC = () => {
  const { openQuickAdd } = useNavigation();
  const {
    workers,
    deleteWorker,
    getTodayAttendance,
    toggleAttendance,
    getPresentCount,
    getAbsentCount
  } = useWorkers();
  const { showToast } = useToast();

  const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null);
  const [workerToEdit, setWorkerToEdit] = useState<Worker | null>(null);
  const [workerToDelete, setWorkerToDelete] = useState<Worker | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [skillFilter, setSkillFilter] = useState<string>('ALL');

  const presentCount = getPresentCount();
  const absentCount = getAbsentCount();
  const onLeaveCount = workers.filter(w => w.status === 'On Leave').length;
  const activeCount = workers.filter(w => w.status === 'Active').length;

  const handleDeleteWorker = () => {
    if (workerToDelete) {
      deleteWorker(workerToDelete.id);
      showToast({
        title: 'Worker Record Removed',
        message: `${workerToDelete.name} (${workerToDelete.workerId}) has been deleted from local state.`,
        type: 'danger'
      });
      setWorkerToDelete(null);
    }
  };

  const handleEditClick = (worker: Worker) => {
    setWorkerToEdit(worker);
    setIsEditModalOpen(true);
  };

  const handleToggleAttendance = (e: React.MouseEvent, worker: Worker) => {
    e.stopPropagation();
    if (worker.status !== 'Active') {
      showToast({
        title: 'Attendance Not Applicable',
        message: `Worker is currently ${worker.status}. Change status to Active to mark daily attendance.`,
        type: 'warning'
      });
      return;
    }
    toggleAttendance(worker.workerId || worker.id);
    const rec = getTodayAttendance(worker.workerId || worker.id);
    const willBePresent = !(rec && rec.present);
    showToast({
      title: willBePresent ? 'Marked Present' : 'Marked Absent',
      message: `${worker.name} marked ${willBePresent ? 'Present on shop floor' : 'Absent today'}.`,
      type: willBePresent ? 'success' : 'info'
    });
  };

  const filteredWorkers = skillFilter === 'ALL'
    ? workers
    : workers.filter(w => w.skill === skillFilter);

  const columns: TableColumn<Worker>[] = [
    {
      header: "Today's Attendance",
      accessor: 'id',
      width: '160px',
      sortable: false,
      render: (w) => {
        if (w.status !== 'Active') {
          return (
            <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
              {w.status === 'On Leave' ? '🌴 On Leave' : `(${w.status})`}
            </span>
          );
        }

        const att = getTodayAttendance(w.workerId || w.id);
        const isPresent = att ? att.present : false;

        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {isPresent ? (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  backgroundColor: 'var(--color-status-success-bg)',
                  color: 'var(--color-status-success-text)',
                  border: '1px solid var(--color-status-success-border)',
                  padding: '3px 8px',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '11px',
                  fontWeight: 600
                }}
              >
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--color-status-success-solid)' }} />
                <span>Present</span>
                {att?.checkInTime && <span style={{ fontSize: '10px', opacity: 0.85, marginLeft: '2px' }}>{att.checkInTime}</span>}
              </span>
            ) : (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  backgroundColor: 'var(--color-status-danger-bg)',
                  color: 'var(--color-status-danger-text)',
                  border: '1px solid var(--color-status-danger-border)',
                  padding: '3px 8px',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '11px',
                  fontWeight: 600
                }}
              >
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', border: '1.5px solid var(--color-status-danger-solid)' }} />
                <span>Absent</span>
              </span>
            )}
            <button
              type="button"
              onClick={(e) => handleToggleAttendance(e, w)}
              className="btn btn-ghost btn-sm btn-icon-only"
              title={isPresent ? 'Click to mark Absent' : 'Click to mark Present'}
              style={{ padding: '2px 4px', height: '24px', width: '24px' }}
            >
              {isPresent ? (
                <UserX size={13} style={{ color: 'var(--color-text-muted)' }} />
              ) : (
                <UserCheck size={13} style={{ color: 'var(--color-status-success-solid)' }} />
              )}
            </button>
          </div>
        );
      }
    },
    {
      header: 'Karigar Name & Code',
      accessor: 'name',
      sortable: true,
      render: (w) => (
        <div>
          <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{w.name}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
            <span className="mono-code" style={{ fontSize: '11px' }}>{w.workerId}</span>
            <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>• {w.mobile}</span>
          </div>
        </div>
      )
    },
    {
      header: 'Skill Profile',
      accessor: 'skill',
      sortable: true,
      render: (w) => (
        <div>
          <span
            style={{
              display: 'inline-block',
              backgroundColor: 'var(--color-status-info-bg)',
              color: 'var(--color-status-info-text)',
              border: '1px solid var(--color-status-info-border)',
              padding: '2px 6px',
              borderRadius: 'var(--radius-sm)',
              fontSize: '11px',
              fontWeight: 600
            }}
          >
            {w.skill}
          </span>
          <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '3px' }}>
            {w.department}
          </div>
        </div>
      )
    },
    {
      header: 'Assigned Shift',
      accessor: 'shift',
      width: '130px',
      sortable: true,
      render: (w) => (
        <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
          {w.shift || 'Shift A (8:00 AM)'}
        </span>
      )
    },
    {
      header: 'Compensation',
      accessor: 'salary',
      align: 'right',
      sortable: true,
      render: (w) => (
        <div style={{ textAlign: 'right' }}>
          <div className="tabular-nums" style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
            ₹{w.salary.toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>{w.salaryType}</div>
        </div>
      )
    },
    {
      header: 'Employment',
      accessor: 'status',
      width: '110px',
      align: 'center',
      sortable: true,
      render: (w) => <StatusBadge status={w.status} size="sm" />
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <PageHeader
        title="Workers & Karigar"
        description="Manage factory floor technicians, machine operators, daily attendance, skill profiles, and compensation."
        breadcrumbs={[
          { label: 'Workers / Karigar' }
        ]}
        actions={
          <Button
            variant="primary"
            icon={<UserPlus size={15} />}
            onClick={() => openQuickAdd('worker')}
          >
            + Add Worker
          </Button>
        }
      />

      {/* Attendance & Workforce Headcount Strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
        <SummaryCard
          title="Floor Present Today"
          value={`${presentCount} Operators`}
          subtitle={`${activeCount > 0 ? Math.round((presentCount / activeCount) * 100) : 0}% floor attendance rate`}
          icon={<UserCheck size={18} />}
          statusTag={{ label: `${presentCount} Present`, variant: 'success' }}
        />
        <SummaryCard
          title="Absent Today"
          value={`${absentCount} Workers`}
          subtitle="Unscheduled floor absence"
          icon={<UserX size={18} />}
          statusTag={{ label: `${absentCount} Absent`, variant: absentCount > 0 ? 'danger' : 'neutral' }}
        />
        <SummaryCard
          title="Approved Leave"
          value={`${onLeaveCount} Karigars`}
          subtitle="Casual / Medical leaves"
          icon={<Clock size={18} />}
          statusTag={{ label: `${onLeaveCount} On Leave`, variant: 'warning' }}
        />
        <SummaryCard
          title="Total Workforce"
          value={`${workers.length} Total`}
          subtitle={`${activeCount} active on payroll`}
          icon={<Users size={18} />}
          statusTag={{ label: `${activeCount} Active`, variant: 'info' }}
        />
      </div>

      {/* Data Table */}
      <DataTable
        data={filteredWorkers}
        columns={columns}
        searchPlaceholder="Search karigar by name, code, skill, department..."
        onRowClick={(row) => {
          setSelectedWorker(row);
          setIsDetailModalOpen(true);
        }}
        toolbarExtra={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)', fontWeight: 500 }}>Skill Filter:</span>
            <select
              value={skillFilter}
              onChange={e => setSkillFilter(e.target.value)}
              className="form-select"
              style={{ width: '180px', padding: '4px 8px', fontSize: '12px' }}
            >
              <option value="ALL">All Skills ({workers.length})</option>
              <option value="CNC Operator">CNC Operator</option>
              <option value="VMC Specialist">VMC Specialist</option>
              <option value="Lathe Master">Lathe Master</option>
              <option value="Tool & Die Maker">Tool & Die Maker</option>
              <option value="Welder / Fabricator">Welder / Fabricator</option>
              <option value="Assembly Specialist">Assembly Specialist</option>
              <option value="Helper / Trainee">Helper / Trainee</option>
            </select>
          </div>
        }
        actions={(row) => (
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'flex-end' }}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSelectedWorker(row);
                setIsDetailModalOpen(true);
              }}
              className="btn btn-ghost btn-sm btn-icon-only"
              title="View Worker Details"
            >
              <Eye size={14} style={{ color: 'var(--color-brand-primary)' }} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleEditClick(row);
              }}
              className="btn btn-ghost btn-sm btn-icon-only"
              title="Edit Employee Details"
              style={{ backgroundColor: 'var(--color-brand-primary-light)' }}
            >
              <Edit3 size={14} style={{ color: 'var(--color-brand-primary)' }} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setWorkerToDelete(row);
              }}
              className="btn btn-ghost btn-sm btn-icon-only"
              title="Delete Worker"
            >
              <Trash2 size={14} style={{ color: 'var(--color-status-danger-solid)' }} />
            </button>
          </div>
        )}
        onAddClick={() => openQuickAdd('worker')}
        addLabel="Add Worker"
      />

      {/* Quick View Details Modal */}
      {selectedWorker && (
        <Modal
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          title={`Worker Profile: ${selectedWorker.name}`}
          subtitle={`Factory Employee ID: ${selectedWorker.workerId}`}
          maxWidth="600px"
          footer={
            <>
              <Button variant="secondary" onClick={() => setIsDetailModalOpen(false)}>
                Close
              </Button>
              <Button
                variant="primary"
                icon={<Edit3 size={14} />}
                onClick={() => {
                  setIsDetailModalOpen(false);
                  handleEditClick(selectedWorker);
                }}
              >
                Edit Details
              </Button>
            </>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', backgroundColor: 'var(--color-bg-subtle)', borderRadius: 'var(--radius-md)' }}>
              <div>
                <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-text-primary)' }}>{selectedWorker.name}</div>
                <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '2px' }}>{selectedWorker.skill} • {selectedWorker.department}</div>
              </div>
              <StatusBadge status={selectedWorker.status} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '13px' }}>
              <div style={{ padding: '8px 12px', border: '1px solid var(--color-border-subtle)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Mobile Contact</div>
                <div style={{ fontWeight: 600, marginTop: '2px' }}>{selectedWorker.mobile}</div>
              </div>
              <div style={{ padding: '8px 12px', border: '1px solid var(--color-border-subtle)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Assigned Shift</div>
                <div style={{ fontWeight: 600, marginTop: '2px' }}>{selectedWorker.shift || 'Shift A (8:00 AM - 8:00 PM)'}</div>
              </div>
              <div style={{ padding: '8px 12px', border: '1px solid var(--color-border-subtle)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Joining Date</div>
                <div style={{ fontWeight: 600, marginTop: '2px' }}>{selectedWorker.joiningDate}</div>
              </div>
              <div style={{ padding: '8px 12px', border: '1px solid var(--color-border-subtle)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Wage / Compensation</div>
                <div className="tabular-nums" style={{ fontWeight: 700, marginTop: '2px', color: 'var(--color-brand-primary)' }}>
                  ₹{selectedWorker.salary.toLocaleString('en-IN')} <span style={{ fontSize: '11px', fontWeight: 400, color: 'var(--color-text-muted)' }}>({selectedWorker.salaryType})</span>
                </div>
              </div>
            </div>

            <div style={{ padding: '8px 12px', border: '1px solid var(--color-border-subtle)', borderRadius: 'var(--radius-md)', fontSize: '13px' }}>
              <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Residential Address</div>
              <div style={{ marginTop: '2px', color: 'var(--color-text-secondary)' }}>{selectedWorker.address}</div>
            </div>
          </div>
        </Modal>
      )}

      {/* Edit Worker Modal */}
      <WorkerEditModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setWorkerToEdit(null);
        }}
        worker={workerToEdit}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={Boolean(workerToDelete)}
        onClose={() => setWorkerToDelete(null)}
        onConfirm={handleDeleteWorker}
        title="Delete Worker Record?"
        message={`Are you sure you want to delete worker record for ${workerToDelete?.name} (${workerToDelete?.workerId})?`}
        confirmLabel="Delete Worker"
      />
    </div>
  );
};
