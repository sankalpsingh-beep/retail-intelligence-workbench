
import axios from "axios";

const api = axios.create({
  baseURL: "http://127.0.0.1:8000",
  timeout: 30000,
});

export const uploadDataset = async (file) => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await api.post("/api/datasets/upload", formData);
  return response.data;
};

export const getDatasetMetadata = async (datasetId) => {
  const response = await api.get(`/api/datasets/${datasetId}/metadata`);
  return response.data;
};

export const cleanDataset = async (datasetId, selectedIssueIds) => {
  const response = await api.post("/api/datasets/clean", {
    dataset_id: datasetId,
    selected_issue_ids: selectedIssueIds,
  });

  return response.data;
};

export const getAnalytics = async (datasetId) => {
  const response = await api.post("/api/datasets/analytics", {
    dataset_id: datasetId,
  });

  return response.data;
};

export const askChatQuestion = async (
  datasetId,
  question,
  sessionId = null,
  datasetVersion = "cleaned"
) => {
  const response = await api.post("/api/chat/query", {
    dataset_id: datasetId,
    question,
    dataset_version: datasetVersion,
    session_id: sessionId,
  });

  return response.data;
};

export const getChatSession = async (sessionId) => {
  const response = await api.get(`/api/chat/sessions/${sessionId}`);
  return response.data;
};

export default api;
export const normalizeDataset = async (datasetId) => {
  const response = await api.post("/api/datasets/normalize", {
    dataset_id: datasetId,
  });

  return response.data;
};

