export const PRIVILEGE_THRESHOLDS = {
  COMMENT_WITHOUT_RESTRICTION: 50,
  EDIT_COMMUNITY_POSTS: 100,
  VOTE_TO_CLOSE: 250,
  REPORT_CONTENT: 500,
};

export const hasPrivilege = (reputation, privilege) => {
  const threshold = PRIVILEGE_THRESHOLDS[privilege];
  if (threshold === undefined) return false;
  return reputation >= threshold;
};