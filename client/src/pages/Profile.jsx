import React, { useState, useEffect } from "react";
import useAuth from "@/hooks/useAuth";
import userApi from "@/api/userApi";
import authApi from "@/api/authApi";
import Card from "@/components/Card";
import Input from "@/components/Input";
import Button from "@/components/Button";
import Alert from "@/components/Alert";
import ConfirmModal from "@/components/ConfirmModal";
import ThemeToggle from "@/components/ThemeToggle";

export const Profile = () => {
  const { user, updateUser, updateToken, logout } = useAuth();

  // Section 1: Update Info
  const [profileData, setProfileData] = useState({
    name: "",
    email: "",
  });
  const [profileErrors, setProfileErrors] = useState({});
  const [profileSuccess, setProfileSuccess] = useState("");
  const [profileError, setProfileError] = useState("");
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || "",
        email: user.email || "",
      });
    }
  }, [user]);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileSuccess("");
    setProfileError("");
    setProfileErrors({});

    if (!profileData.name.trim() || profileData.name.trim().length < 2) {
      setProfileErrors({ name: "Name must be at least 2 characters" });
      return;
    }

    if (!profileData.email.trim() || !/^\S+@\S+\.\S+$/.test(profileData.email.trim())) {
      setProfileErrors({ email: "Please enter a valid email address" });
      return;
    }

    setIsUpdatingProfile(true);
    try {
      const updatedUser = await userApi.updateMe({
        name: profileData.name.trim(),
        email: profileData.email.trim(),
      });
      updateUser(updatedUser);
      setProfileSuccess("Profile details updated successfully!");
    } catch (err) {
      setProfileError(err.message || "Failed to update profile");
      if (err.fieldErrors) {
        setProfileErrors(err.fieldErrors);
      }
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  // Section 2: Change Password
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmNewPassword: "",
  });
  const [passwordErrors, setPasswordErrors] = useState({});
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordSuccess("");
    setPasswordError("");
    setPasswordErrors({});

    const newErrors = {};
    if (!passwordData.currentPassword) {
      newErrors.currentPassword = "Current password is required";
    }
    if (!passwordData.newPassword) {
      newErrors.newPassword = "New password is required";
    } else if (passwordData.newPassword.length < 8) {
      newErrors.newPassword = "Password must be at least 8 characters";
    } else if (!/^(?=.*[A-Za-z])(?=.*\d)/.test(passwordData.newPassword)) {
      newErrors.newPassword = "Must contain at least one letter and one number";
    } else if (passwordData.newPassword === passwordData.currentPassword) {
      newErrors.newPassword = "New password must differ from current password";
    }

    if (passwordData.newPassword !== passwordData.confirmNewPassword) {
      newErrors.confirmNewPassword = "Passwords do not match";
    }

    if (Object.keys(newErrors).length > 0) {
      setPasswordErrors(newErrors);
      return;
    }

    setIsChangingPassword(true);
    try {
      const result = await authApi.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      if (result.token) {
        updateToken(result.token);
      }
      setPasswordSuccess("Password changed successfully! Session preserved.");
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmNewPassword: "",
      });
    } catch (err) {
      setPasswordError(err.message || "Failed to update password");
      if (err.fieldErrors) {
        setPasswordErrors(err.fieldErrors);
      }
    } finally {
      setIsChangingPassword(false);
    }
  };

  // Section 3: Delete Account
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const handleDeleteAccount = async () => {
    setIsDeletingAccount(true);
    setDeleteError("");
    try {
      await userApi.deleteMe();
      logout();
    } catch (err) {
      setDeleteError(err.message || "Failed to delete account");
      setIsDeleteModalOpen(false);
    } finally {
      setIsDeletingAccount(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
          Account Settings
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Manage your personal information, appearance, and security settings.
        </p>
      </div>

      {/* Section: Appearance */}
      <Card className="space-y-4">
        <div>
          <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">
            Appearance
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Customize the interface theme for your workspace.
          </p>
        </div>
        <div className="pt-1">
          <ThemeToggle showLabels={true} />
        </div>
      </Card>

      {/* Section 1: Update Profile */}
      <Card className="space-y-4">
        <div>
          <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">
            Personal Information
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Update your name and email address.
          </p>
        </div>

        {profileSuccess && <Alert type="success" message={profileSuccess} />}
        {profileError && <Alert type="error" message={profileError} />}

        <form onSubmit={handleProfileSubmit} className="space-y-4">
          <Input
            label="Name"
            value={profileData.name}
            onChange={(e) =>
              setProfileData((prev) => ({ ...prev, name: e.target.value }))
            }
            error={profileErrors.name}
            required
          />

          <Input
            label="Email Address"
            type="email"
            value={profileData.email}
            onChange={(e) =>
              setProfileData((prev) => ({ ...prev, email: e.target.value }))
            }
            error={profileErrors.email}
            required
          />

          <div className="flex justify-end pt-2">
            <Button type="submit" variant="primary" isLoading={isUpdatingProfile}>
              Save Profile
            </Button>
          </div>
        </form>
      </Card>

      {/* Section 2: Change Password */}
      <Card className="space-y-4">
        <div>
          <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">
            Change Password
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Ensure your account is using a long, random password to stay secure.
          </p>
        </div>

        {passwordSuccess && <Alert type="success" message={passwordSuccess} />}
        {passwordError && <Alert type="error" message={passwordError} />}

        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          <Input
            label="Current Password"
            type="password"
            value={passwordData.currentPassword}
            onChange={(e) =>
              setPasswordData((prev) => ({
                ...prev,
                currentPassword: e.target.value,
              }))
            }
            error={passwordErrors.currentPassword}
            required
          />

          <Input
            label="New Password"
            type="password"
            value={passwordData.newPassword}
            onChange={(e) =>
              setPasswordData((prev) => ({
                ...prev,
                newPassword: e.target.value,
              }))
            }
            placeholder="At least 8 chars with letter & number"
            error={passwordErrors.newPassword}
            required
          />

          <Input
            label="Confirm New Password"
            type="password"
            value={passwordData.confirmNewPassword}
            onChange={(e) =>
              setPasswordData((prev) => ({
                ...prev,
                confirmNewPassword: e.target.value,
              }))
            }
            error={passwordErrors.confirmNewPassword}
            required
          />

          <div className="flex justify-end pt-2">
            <Button type="submit" variant="primary" isLoading={isChangingPassword}>
              Update Password
            </Button>
          </div>
        </form>
      </Card>

      {/* Section 3: Danger Zone */}
      <Card className="border-red-200 dark:border-red-900/50 bg-red-50/20 dark:bg-red-950/20 space-y-4">
        <div>
          <h2 className="text-lg font-medium text-red-700 dark:text-red-300">
            Delete Account
          </h2>
          <p className="text-sm text-red-600 dark:text-red-400">
            Permanently remove your account and all associated conversations. This action cannot be reversed.
          </p>
        </div>

        {deleteError && <Alert type="error" message={deleteError} />}

        <div className="flex justify-end pt-2">
          <Button
            variant="danger"
            onClick={() => setIsDeleteModalOpen(true)}
          >
            Delete Account
          </Button>
        </div>
      </Card>

      {/* Account Deletion Confirmation Modal */}
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        title="Delete Account"
        message="Are you sure you want to delete your account? All of your conversations and personal data will be immediately and permanently destroyed."
        confirmLabel="Permanently Delete Account"
        confirmVariant="danger"
        isLoading={isDeletingAccount}
        onConfirm={handleDeleteAccount}
        onCancel={() => setIsDeleteModalOpen(false)}
      />
    </div>
  );
};

export default Profile;
