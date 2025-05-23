
import { Request } from "@/types/profileTypes";

// Helper function to update the status of a request based on participant counts
export const updateRequestStatus = (request: Request): Request => {
  if (!request) return request;

  // For multi-department requests and projects
  if (request.multiDepartment || request.type === "project") {
    const acceptedCount = Array.isArray(request.acceptedBy) ? request.acceptedBy.length : 0;
    const usersNeeded = request.usersNeeded || 2;
    
    // Status should be "Pending" if less users have accepted than needed
    // Only change to "In Process" when ALL required users have accepted
    if (acceptedCount < usersNeeded) {
      return {
        ...request,
        status: "Pending",
        usersAccepted: acceptedCount
      };
    } 
    // Status is "In Process" only if all required users have accepted
    else {
      return {
        ...request,
        status: "In Process",
        usersAccepted: acceptedCount
      };
    }
  }
  
  return request;
};

// Helper function to check if a user can accept a request
export const canUserAcceptRequest = (
  request: Request,
  username: string,
  userDepartment: string
): boolean => {
  // User cannot accept their own request
  if (request.creator === username) return false;
  
  // User cannot accept completed or rejected single requests
  if (request.status === "Completed") return false;
  if (request.status === "Rejected" && !request.multiDepartment && request.type !== "project") return false;
  
  // Single department request - user must be from the requested department
  if (!request.multiDepartment && request.type !== "project") {
    // Check if the request is already accepted by someone
    const isAlreadyAccepted = Array.isArray(request.acceptedBy) && request.acceptedBy.length > 0;
    return userDepartment === request.department && !isAlreadyAccepted;
  }
  
  // Multi-department request or project
  if (request.multiDepartment || request.type === "project") {
    // For multi-department requests and projects, check if the user's department is in the list
    const targetDepartments = Array.isArray(request.departments) ? request.departments : [request.department];
    
    // User must be from one of the target departments
    const isFromTargetDepartment = targetDepartments.includes(userDepartment);
    
    // User must not have already accepted this request/project
    const hasAlreadyAccepted = Array.isArray(request.acceptedBy) && request.acceptedBy.includes(username);
    
    return isFromTargetDepartment && !hasAlreadyAccepted;
  }
  
  return false;
};

// Helper function to handle a user accepting a request
export const handleAcceptRequest = (
  allRequests: Request[],
  requestId: string, 
  username: string
): Request[] => {
  return allRequests.map(req => {
    if (req.id === requestId) {
      // Create or update the acceptedBy array
      const acceptedBy = Array.isArray(req.acceptedBy) ? [...req.acceptedBy, username] : [username];
      
      // Update the usersAccepted count
      const usersAccepted = acceptedBy.length;
      const usersNeeded = req.usersNeeded || 2;
      
      // Status must be "Pending" if there are fewer users than needed
      // Status should be "In Process" only if all required users have accepted
      const newStatus = usersAccepted < usersNeeded ? "Pending" : "In Process";
      
      return {
        ...req,
        acceptedBy,
        usersAccepted,
        status: req.multiDepartment || req.type === "project" ? newStatus : "In Process",
        lastStatusUpdateTime: new Date().toLocaleTimeString(),
        lastStatusUpdate: new Date().toISOString()
      };
    }
    return req;
  });
};
