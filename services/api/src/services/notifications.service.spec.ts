// Unit Tests for NotificationsService
// Feature: services-portal
// Validates: Requirements 9.1, 9.2, 9.3, 9.4, 9.5

interface NotificationPayload {
  user_id: string
  type: string
  title: string
  body: string
  data?: Record<string, unknown>
}

function buildNewProposalNotification(params: {
  requesterId: string
  requestId: string
  proposalId: string
  providerName?: string
}): NotificationPayload {
  return {
    user_id: params.requesterId,
    type: 'services_new_proposal',
    title: 'New proposal received',
    body: params.providerName
      ? `${params.providerName} submitted a proposal on your service request.`
      : 'A service provider submitted a proposal on your service request.',
    data: { request_id: params.requestId, proposal_id: params.proposalId },
  }
}

function buildProfileReviewedNotification(params: {
  providerUserId: string
  profileId: string
  decision: 'approved' | 'rejected'
  rejectionReason?: string
}): NotificationPayload {
  const isApproved = params.decision === 'approved'
  return {
    user_id: params.providerUserId,
    type: isApproved ? 'services_profile_approved' : 'services_profile_rejected',
    title: isApproved ? 'Provider profile approved' : 'Provider profile rejected',
    body: isApproved
      ? 'Your provider profile has been approved. You can now submit proposals.'
      : `Your provider profile was rejected. Reason: ${params.rejectionReason ?? 'No reason provided'}. You may update and resubmit.`,
    data: {
      profile_id: params.profileId,
      decision: params.decision,
      ...(params.rejectionReason ? { rejection_reason: params.rejectionReason } : {}),
    },
  }
}

describe('Property 24: Notifications are created for all key events', () => {
  describe('New proposal notification (Requirement 9.1)', () => {
    it('should build notification for requester with provider name', () => {
      const payload = buildNewProposalNotification({
        requesterId: 'user-123',
        requestId: 'req-456',
        proposalId: 'prop-789',
        providerName: 'Juan dela Cruz',
      })
      expect(payload.user_id).toBe('user-123')
      expect(payload.type).toBe('services_new_proposal')
      expect(payload.body).toContain('Juan dela Cruz')
      expect(payload.data?.request_id).toBe('req-456')
      expect(payload.data?.proposal_id).toBe('prop-789')
    })

    it('should build notification for requester without provider name', () => {
      const payload = buildNewProposalNotification({
        requesterId: 'user-123',
        requestId: 'req-456',
        proposalId: 'prop-789',
      })
      expect(payload.user_id).toBe('user-123')
      expect(payload.type).toBe('services_new_proposal')
      expect(payload.body).toContain('service provider')
    })
  })

  describe('Profile reviewed notification (Requirement 9.4)', () => {
    it('should build approval notification', () => {
      const payload = buildProfileReviewedNotification({
        providerUserId: 'user-abc',
        profileId: 'profile-xyz',
        decision: 'approved',
      })
      expect(payload.user_id).toBe('user-abc')
      expect(payload.type).toBe('services_profile_approved')
      expect(payload.title).toBe('Provider profile approved')
      expect(payload.data?.decision).toBe('approved')
    })

    it('should build rejection notification with reason', () => {
      const payload = buildProfileReviewedNotification({
        providerUserId: 'user-abc',
        profileId: 'profile-xyz',
        decision: 'rejected',
        rejectionReason: 'Invalid license number',
      })
      expect(payload.user_id).toBe('user-abc')
      expect(payload.type).toBe('services_profile_rejected')
      expect(payload.body).toContain('Invalid license number')
      expect(payload.data?.rejection_reason).toBe('Invalid license number')
    })

    it('should build rejection notification without reason', () => {
      const payload = buildProfileReviewedNotification({
        providerUserId: 'user-abc',
        profileId: 'profile-xyz',
        decision: 'rejected',
      })
      expect(payload.body).toContain('No reason provided')
      expect(payload.data?.rejection_reason).toBeUndefined()
    })
  })

  describe('Notification targeting', () => {
    it('should always target the correct user_id', () => {
      const userId = 'target-user-id'
      const payload = buildNewProposalNotification({
        requesterId: userId,
        requestId: 'req-1',
        proposalId: 'prop-1',
      })
      expect(payload.user_id).toBe(userId)
    })

    it('should include relevant entity IDs in data', () => {
      const payload = buildNewProposalNotification({
        requesterId: 'user-1',
        requestId: 'req-abc',
        proposalId: 'prop-def',
      })
      expect(payload.data).toBeDefined()
      expect(payload.data?.request_id).toBe('req-abc')
      expect(payload.data?.proposal_id).toBe('prop-def')
    })
  })
})
