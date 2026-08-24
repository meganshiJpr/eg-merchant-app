function getSessionOperatorsData() {
  if (typeof window === "undefined") return null;
  try {
    const cached = sessionStorage.getItem("contractor_list_session");
    return cached ? JSON.parse(cached) : null;
  } catch (err) {
    console.warn("Could not read contractor_list_session from sessionStorage:", err);
    return null;
  }
}

/**
 * Resolves operatorName, circleName, and operatorLogo from contractor_list_session using raw operator/circle IDs.
 */
export function resolveOperatorCircleInfo(opIdInput, circleIdInput) {
  const sessionData = getSessionOperatorsData();
  const rawOps = sessionData?.operators?.all || (Array.isArray(sessionData) ? sessionData : []);
  const rawCircles = sessionData?.circles || sessionData?.operators?.circles || sessionData?.states || [];
  const basePath = sessionData?.operator_img || "https://staging.paybyapis.com/images/operators/";

  const opId = opIdInput !== null && opIdInput !== undefined ? String(opIdInput) : "";
  const circleId = circleIdInput !== null && circleIdInput !== undefined ? String(circleIdInput) : "";

  let resolvedOpName = "";
  let resolvedLogo = null;
  let resolvedCircleName = "";

  if (Array.isArray(rawOps) && opId) {
    const foundOp = rawOps.find((o) => String(o.id) === opId || String(o.name).toLowerCase() === opId.toLowerCase());
    if (foundOp) {
      resolvedOpName = foundOp.name || "";
      if (foundOp.logo) {
        resolvedLogo = foundOp.logo.startsWith("http") ? foundOp.logo : `${basePath}${foundOp.logo}`;
      }
    } else if (isNaN(Number(opId))) {
      resolvedOpName = opId;
    }
  } else if (opId && isNaN(Number(opId))) {
    resolvedOpName = opId;
  }

  if (Array.isArray(rawCircles) && circleId) {
    const foundState = rawCircles.find(
      (s) => String(s.id) === circleId || String(s.state_name).toLowerCase() === circleId.toLowerCase()
    );
    if (foundState) {
      resolvedCircleName = foundState.state_name || "";
    } else if (isNaN(Number(circleId))) {
      resolvedCircleName = circleId;
    }
  } else if (circleId && isNaN(Number(circleId))) {
    resolvedCircleName = circleId;
  }

  return {
    operatorName: resolvedOpName || opId || "-",
    circleName: resolvedCircleName || circleId || "-",
    operatorLogo: resolvedLogo,
  };
}
