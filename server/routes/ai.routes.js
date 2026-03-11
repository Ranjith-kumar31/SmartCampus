const express = require('express');
const supabase = require('../utils/supabase');

const router = express.Router();

/**
 * GET /api/ai/suggestions/:studentId
 * Returns AI-powered event recommendations based on:
 * 1. Department (domain match)
 * 2. Past registration interest profiling
 * 3. OD approval history (HOD approval probability)
 * 4. Event urgency & free registration bonus
 */
router.get('/suggestions/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;

    // Get student info
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('*')
      .eq('id', studentId)
      .single();

    if (studentError || !student) return res.status(404).json({ message: 'Student not found' });

    // Events student already registered for
    const { data: registrations, error: regError } = await supabase
      .from('event_registrations')
      .select('event_id, events(*, clubs(*))')
      .eq('student_id', studentId);

    if (regError) throw regError;

    const registeredEvents = registrations.map(r => r.events);
    const registeredEventIds = new Set(registrations.map(r => r.event_id));

    // Build domain & club interest maps from past registrations
    const domainFrequency = {};
    const clubFrequency = {};
    registeredEvents.forEach((e) => {
      if (!e) return;
      const domain = (e.domain || 'general').toLowerCase();
      domainFrequency[domain] = (domainFrequency[domain] || 0) + 1;
      if (e.club_id) {
        const cid = e.club_id.toString();
        clubFrequency[cid] = (clubFrequency[cid] || 0) + 1;
      }
    });

    // OD approval rate
    const { data: odRequests, error: odError } = await supabase
      .from('od_requests')
      .select('status')
      .eq('student_id', studentId);

    if (odError) throw odError;

    const odApproved = odRequests.filter((od) => od.status === 'Approved').length;
    const odTotal = odRequests.length;
    const odApprovalRate = odTotal > 0 ? odApproved / odTotal : 0.5;

    // All upcoming approved events not yet registered
    const today = new Date().toISOString().split('T')[0];
    const { data: allEvents, error: allEventsError } = await supabase
      .from('events')
      .select('*, club:clubs(*)')
      .eq('status', 'Approved');

    if (allEventsError) throw allEventsError;

    const upcomingNew = allEvents.filter((e) =>
      !registeredEventIds.has(e.id) && e.date >= today
    );

    // --- AI Scoring ---
    const scored = upcomingNew.map((event) => {
      let score = 0;
      const reasons = [];

      const domain = (event.domain || 'general').toLowerCase();
      const studentDept = (student.department || '').toLowerCase();

      // 1. Department / domain match (30 pts)
      if (domain.includes(studentDept) || studentDept.includes(domain)) {
        score += 30;
        reasons.push(`Matches your ${student.department} department`);
      }

      // 2. Domain interest from history (up to 25 pts)
      if (domainFrequency[domain]) {
        const pts = Math.min(25, domainFrequency[domain] * 8);
        score += pts;
        reasons.push(`You've attended ${domainFrequency[domain]} similar ${domain.toUpperCase()} events`);
      }

      // 3. Preferred club (up to 20 pts)
      const clubId = event.club_id ? event.club_id.toString() : null;
      if (clubId && clubFrequency[clubId]) {
        const pts = Math.min(20, clubFrequency[clubId] * 10);
        score += pts;
        reasons.push(`From ${event.club.name}, a club you've attended before`);
      }

      // 4. Free registration bonus (10 pts)
      if (!event.reg_fee || event.reg_fee === 0) {
        score += 10;
        reasons.push('Free registration — no cost to join');
      }

      // 5. OD approval probability (up to 15 pts)
      const odScore = Math.round(odApprovalRate * 15);
      score += odScore;
      const odPct = Math.round(odApprovalRate * 100);
      if (odPct >= 70) {
        reasons.push(`High OD approval chance (~${odPct}% based on your history)`);
      } else if (odPct > 0) {
        reasons.push(`Your OD requests have ~${odPct}% approval rate`);
      }

      // 6. Urgency bonus (up to 10 pts)
      const daysUntil = Math.ceil(
        (new Date(event.date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      );
      if (daysUntil <= 7) {
        score += 10;
        reasons.push(`Happening in ${daysUntil} day${daysUntil === 1 ? '' : 's'} — register now!`);
      } else if (daysUntil <= 30) {
        score += 5;
        reasons.push(`Coming up in ${daysUntil} days`);
      }

      // Match label
      let matchLabel = 'Low Match';
      let matchColor = 'slate';
      if (score >= 70) { matchLabel = 'Perfect Match'; matchColor = 'emerald'; }
      else if (score >= 50) { matchLabel = 'Strong Match'; matchColor = 'indigo'; }
      else if (score >= 30) { matchLabel = 'Good Match'; matchColor = 'amber'; }

      return {
        event: {
          _id: event.id,
          title: event.title,
          domain: event.domain,
          date: event.date,
          time: event.time,
          location: event.location,
          regFee: event.reg_fee,
          description: event.description,
          club: event.club,
          prizes: event.prizes,
        },
        score,
        matchLabel,
        matchColor,
        reasons,
        topReason: reasons[0] || `Recommended for ${student.department} students`,
        odProbability: odPct,
        daysUntil,
      };
    });

    const recommendations = scored.sort((a, b) => b.score - a.score).slice(0, 5);

    // AI narrative insight
    const topEntry = Object.entries(domainFrequency).sort((a, b) => b[1] - a[1])[0];
    const topDomain = topEntry ? topEntry[0] : null;
    const insight = topDomain
      ? `Based on your ${registeredEvents.length} previous registration${registeredEvents.length !== 1 ? 's' : ''}, you have a strong interest in ${topDomain.toUpperCase()} events. Your OD requests have a ${Math.round(odApprovalRate * 100)}% approval rate.`
      : `Welcome! Here are events tailored to your ${student.department} department to get you started.`;

    res.json({
      insight,
      odApprovalRate: Math.round(odApprovalRate * 100),
      totalRegistered: registeredEvents.length,
      recommendations,
    });

  } catch (error) {
    console.error('AI Suggestions error:', error);
    res.status(500).json({ message: 'Failed to generate suggestions' });
  }
});

module.exports = router;
