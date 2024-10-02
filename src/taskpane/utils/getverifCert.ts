import { API_URL } from "../constants/apiURL";
import axios from "axios";

export async function getcert(email: string) {
  const response = await axios.get(`${API_URL}/${email}`);
  return response.data["fileText"].replace(/\\n/gi, "\n");
}
