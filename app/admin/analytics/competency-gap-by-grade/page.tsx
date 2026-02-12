'use client'

import { useState, useEffect } from 'react';
import { cggAPI, assessmentAPI } from '@/lib/api';

interface ReportRow {
  Grade: string;
  AverageGap: string;
}

interface CompetencyGapReport {
  Competency: string;
  Results: ReportRow[];
}

export default function CompetencyGapByGrade() {
  const [assessments, setAssessments] = useState<any[]>([]);
  const [selectedAssessmentId, setSelectedAssessmentId] = useState('');
  const [data, setData] = useState<CompetencyGapReport[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingAssessments, setLoadingAssessments] = useState(true);

  // Fetch assessments on component mount
  useEffect(() => {
    const fetchAssessments = async () => {
      try {
        setLoadingAssessments(true);
        const result = await assessmentAPI.getAll();
        setAssessments(Array.isArray(result) ? result : []);
        if (Array.isArray(result) && result.length > 0) {
          setSelectedAssessmentId(result[0].id || '');
        }
      } catch (err: any) {
        console.error('Error fetching assessments:', err);
        setError('Failed to load assessments');
      } finally {
        setLoadingAssessments(false);
      }
    };

    fetchAssessments();
  }, []);

  const handleGenerateReport = async () => {
    if (!selectedAssessmentId) {
      setError('Please select an assessment first');
      return;
    }

    setLoading(true);
    setError(null);
    setData(null);
    
    try {
      const result = await cggAPI.generate({ assessmentId: selectedAssessmentId });
      setData(Array.isArray(result) ? result : []);
    } catch (err: any) {
      console.error('Error generating report:', err);
      setError(err.message || 'Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>Competency Gap by Grade Report</h1>
      
      {loadingAssessments && (
        <p style={{ color: '#007bff', fontStyle: 'italic' }}>Loading assessments...</p>
      )}

      {/* Assessment Selection */}
      <div style={{ marginBottom: '20px' }}>
        <label htmlFor="assessment-select" style={{ marginRight: '10px', fontWeight: 'bold' }}>
          Select Assessment:
        </label>
        <select
          id="assessment-select"
          value={selectedAssessmentId}
          onChange={(e) => {
            setSelectedAssessmentId(e.target.value);
            setError(null);
          }}
          disabled={loadingAssessments}
          style={{
            padding: '8px 12px',
            borderRadius: '4px',
            border: '1px solid #ccc',
            cursor: loadingAssessments ? 'not-allowed' : 'pointer'
          }}
        >
          <option value="">Choose an assessment...</option>
          {assessments.map((assessment) => (
            <option key={assessment.id} value={assessment.id}>
              {assessment.name || assessment.id}
            </option>
          ))}
        </select>
      </div>

      {/* Generate Report Button */}
      <div style={{ marginBottom: '20px' }}>
        <button
          onClick={handleGenerateReport}
          disabled={loading || !selectedAssessmentId}
          style={{
            padding: '10px 20px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading || !selectedAssessmentId ? 'not-allowed' : 'pointer',
            opacity: loading || !selectedAssessmentId ? 0.5 : 1,
          }}
        >
          {loading ? 'Generating...' : 'Generate Report'}
        </button>
      </div>

      {/* Loading State */}
      {loading && (
        <p style={{ color: '#007bff', fontWeight: 'bold' }}>Loading report...</p>
      )}

     

      {/* Report Data Display */}
      {data && data.length > 0 ? (
        <div>
          <h2>Report Results</h2>
          {data.map((competency, index) => (
            <div key={index} style={{ marginBottom: '30px' }}>
              <h3 style={{ backgroundColor: '#f0f0f0', padding: '10px', borderRadius: '4px' }}>
                {competency.Competency}
              </h3>
              <table
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  border: '1px solid #ddd'
                }}
              >
                <thead>
                  <tr style={{ backgroundColor: '#e9ecef' }}>
                    <th style={{ border: '1px solid #ddd', padding: '10px', textAlign: 'left' }}>
                      Grade
                    </th>
                    <th style={{ border: '1px solid #ddd', padding: '10px', textAlign: 'left' }}>
                      Average Gap
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {competency.Results.map((result, rowIndex) => (
                    <tr key={rowIndex}>
                      <td style={{ border: '1px solid #ddd', padding: '10px' }}>
                        {result.Grade}
                      </td>
                      <td style={{ border: '1px solid #ddd', padding: '10px' }}>
                        {result.AverageGap}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      ) : data && data.length === 0 ? (
        <p style={{ color: '#666' }}>No data available for the selected assessment.</p>
      ) : null}
    </div>
  );
}