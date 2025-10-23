import type { Handler } from "@netlify/functions";
import data from "../../shared/data/municipalities.mx.json";

function normalize(s: string) {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

const handler: Handler = async (event) => {
  const query = event.queryStringParameters?.q || "";
  const normQ = normalize(query);
  const limit = Number(event.queryStringParameters?.limit || 25);

  if (!normQ || normQ.length < 2) {
    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({ results: [] }),
    };
  }

  const results = (data as any[])
    .filter(
      (r: any) =>
        normalize(r.stateName).includes(normQ) ||
        normalize(r.municipalityName).includes(normQ)
    )
    .slice(0, limit)
    .map((r: any) => ({
      id: `${r.stateId}-${r.municipalityId}`,
      label: `${r.municipalityName}, ${r.stateName}`,
      stateId: r.stateId,
      municipalityId: r.municipalityId,
    }));

  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
    body: JSON.stringify({ results }),
  };
};

export { handler };
