import {
  computeCoverDrawSize,
  PROFILE_IMAGE_OUTPUT_SIZE,
} from '@/lib/resume-builder/profile-image-crop';
import { profileImageFieldPatch } from '@/lib/resume-builder/profile-image-persistence';

describe('profile image crop math', () => {
  it('scales landscape images to cover the output square', () => {
    const { drawWidth, drawHeight } = computeCoverDrawSize(1600, 900, 512, 1);
    expect(drawWidth).toBeGreaterThanOrEqual(512);
    expect(drawHeight).toBeGreaterThanOrEqual(512);
    expect(Math.abs(drawWidth - drawHeight)).toBeGreaterThan(0);
  });

  it('applies zoom on top of cover fit', () => {
    const base = computeCoverDrawSize(800, 800, PROFILE_IMAGE_OUTPUT_SIZE, 1);
    const zoomed = computeCoverDrawSize(800, 800, PROFILE_IMAGE_OUTPUT_SIZE, 1.5);
    expect(zoomed.drawWidth).toBeCloseTo(base.drawWidth * 1.5, 5);
    expect(zoomed.drawHeight).toBeCloseTo(base.drawHeight * 1.5, 5);
  });

  it('uses identical width and height for square sources at zoom 1', () => {
    const { drawWidth, drawHeight } = computeCoverDrawSize(600, 600, 512, 1);
    expect(drawWidth).toBe(512);
    expect(drawHeight).toBe(512);
  });
});

describe('profile image field aliases', () => {
  const userPhoto = 'data:image/jpeg;base64,/9j/user-photo';

  it('writes all known aliases via profileImageFieldPatch', () => {
    const patch = profileImageFieldPatch(userPhoto);
    expect(patch.profileImage).toBe(userPhoto);
    expect(patch.photo).toBe(userPhoto);
    expect(patch.profilePhoto).toBe(userPhoto);
    expect(patch['Profile Image']).toBe(userPhoto);
    expect(patch.Photo).toBe(userPhoto);
  });

  it('clears all aliases when photo is removed', () => {
    const patch = profileImageFieldPatch('');
    expect(Object.values(patch).every((value) => value === '')).toBe(true);
  });
});
