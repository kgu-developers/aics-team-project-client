type AdminProfileMockState = {
  introduction: string;
};

const initialState: AdminProfileMockState = {
  introduction: '',
};

let state = initialState;

export function getAdminProfile() {
  return { ...state };
}

export function updateAdminProfile(input: { introduction: string }) {
  state = { introduction: input.introduction };

  return getAdminProfile();
}

export function resetAdminProfileMockData() {
  state = initialState;
}
