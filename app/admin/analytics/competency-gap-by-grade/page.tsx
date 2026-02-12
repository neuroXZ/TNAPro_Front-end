'use client';

import { useState, useEffect } from 'react';
import { cggAPI, assessmentAPI } from '@/lib/api';

interface Assessment {
  id: string;
  name: string;
}

interface ReportRow {
  Grade: string;
  AverageGap: string;
}

interface CompetencyGapReport {
  Competency: string;
  Results: ReportRow[];
}

export default function CompetencyGapByGrade() {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [selectedAssessmentId, setSelectedAssessmentId] = useState('');
  const [reportData, setReportData] = useState<CompetencyGapReport[]>([]);
  const [isLoadingAssessments, setIsLoadingAssessments] = useState(true);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch assessments on mount
  useEffect(() => {
    const loadAssessments = async () => {
      try {
        setIsLoadingAssessments(true);
        setError(null);
        const result = await assessmentAPI.getAll();
        const assessmentList = Array.isArray(result) ? result : [];
        setAssessments(assessmentList);
        
        if (assessmentList.length > 0) {
          setSelectedAssessmentId(assessmentList[0].id);
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to load assessments';
        console.error('Error loading assessments:', err);
        setError(message);
      } finally {
        setIsLoadingAssessments(false);
      }
    };

    loadAssessments();
  }, []);

  const handleGenerateReport = async () => {
    if (!selectedAssessmentId) {
      setError('Please select an assessment');
      return;
    }

    try {
      setIsGeneratingReport(true);
      setError(null);
      setReportData([]);

      const result = await cggAPI.generate({ assessmentId: selectedAssessmentId });
      setReportData(Array.isArray(result) ? result : []);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to generate report';
      console.error('Error generating report:', err);
      setError(message);
    } finally {
      setIsGeneratingReport(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">Competency Gap by Grade</h1>
        <p className="text-gray-600 mt-2">
          Analyze competency gaps across different job grades
        </p>
      </div>

      {/* Assessment Selection Section */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex gap-4 items-end">
          <div className="flex-1">
            <label htmlFor="assessment" className="block text-sm font-medium text-gray-700 mb-2">
              Select Assessment
            </label>
            <select
              id="assessment"
              value={selectedAssessmentId}
              onChange={(e) => {
                setSelectedAssessmentId(e.target.value);
                setError(null);
              }}
              disabled={isLoadingAssessments}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="">Choose an assessment...</option>
              {assessments.map((assessment) => (
                <option key={assessment.id} value={assessment.id}>
                  {assessment.name || assessment.id}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleGenerateReport}
            disabled={isGeneratingReport || !selectedAssessmentId || isLoadingAssessments}
            className="px-6 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isGeneratingReport ? 'Generating...' : 'Generate Report'}
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      {/* Loading State */}
      {isGeneratingReport && (
        <div className="flex items-center justify-center p-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading report...</span>
        </div>
      )}

      {/* Report Results */}
      {reportData.length > 0 && (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold">Report Results</h2>
          {reportData.map((competency, index) => (
            <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">{competency.Competency}</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-100 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                        Grade
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                        Average Gap
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {competency.Results.map((result, rowIndex) => (
                      <tr key={rowIndex} className="border-b border-gray-200 hover:bg-gray-50">
                        <td className="px-6 py-3 text-sm text-gray-900">{result.Grade}</td>
                        <td className="px-6 py-3 text-sm font-medium text-gray-900">
                          {parseFloat(result.AverageGap).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isGeneratingReport && reportData.length === 0 && !error && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-12 text-center">
          <p className="text-gray-600">
            {selectedAssessmentId
              ? 'Click "Generate Report" to view the competency gap analysis'
              : 'Select an assessment to get started'}
          </p>
        </div>
      )}
    </div>
  );
}