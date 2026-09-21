import { describe, expect, it } from "vitest";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { migrateStanceProfile, prepareWeaponStanceProfile } from "../electron/services/weapon-stance-profile.js";
const source = '<Profile name="User"><ActionSet name="Generic"><Action name="ToggleDebugConsole" unbindable="true"><Trigger>Tilde</Trigger></Action><Action name="OpenMap"><Trigger>M</Trigger></Action><Action name="ToggleNetworkStats"><Trigger>N</Trigger></Action></ActionSet><ActionSet name="Infantry"><Action name="Sprint"><Trigger>Shift</Trigger></Action></ActionSet></Profile>';
describe("stance binding migration and rollback", () => {
  it("records ownership on first launch and removes inherited actions on rollback", async () => {
    const root = await mkdtemp(join(tmpdir(), "rotk-stance-first-"));
    const state = join(root, "state");
    try {
      await prepareWeaponStanceProfile(root, state, true);
      const inherited = migrateStanceProfile(source, true).text;
      await writeFile(join(root, "InputProfile_User.xml"), inherited);
      await prepareWeaponStanceProfile(root, state, false);
      const restored = await readFile(join(root, "InputProfile_User.xml"), "utf8");
      expect(restored).not.toContain('name="ToggleWeaponStance"');
      expect(restored).not.toContain('name="ROTKConsole"');
      expect(restored).toContain('<Trigger>M</Trigger>');
    } finally { await rm(root, { recursive: true, force: true }); }
  });
  it("refuses corrupt ownership without overwriting the player's profile", async () => {
    const root = await mkdtemp(join(tmpdir(), "rotk-stance-state-"));
    const state = join(root, "state");
    try {
      await mkdir(state); await writeFile(join(root, "InputProfile_User.xml"), source);
      await writeFile(join(state, "weapon-stance.v1.json"), JSON.stringify({ added: ["OpenMap"], removedNetworkN: true }));
      await expect(prepareWeaponStanceProfile(root, state, false)).rejects.toThrow("invalide");
      expect(await readFile(join(root, "InputProfile_User.xml"), "utf8")).toBe(source);
    } finally { await rm(root, { recursive: true, force: true }); }
  });
  it("keeps console internals and unrelated bindings intact", () => {
    const next = migrateStanceProfile(source, true);
    expect(next.text).toContain('<Action name="ToggleDebugConsole" unbindable="true"><Trigger>Tilde</Trigger></Action>');
    expect(next.text).toContain('<Action name="OpenMap"><Trigger>M</Trigger></Action>');
    expect(next.text).toContain('<Action name="Sprint"><Trigger>Shift</Trigger></Action>');
    expect(next.text).toContain('<Action name="ROTKConsole" version="1"><Trigger>N</Trigger></Action>');
    expect(migrateStanceProfile(next.text,true,next.state)).toEqual(next);
  });
  it("preserves custom stance and console shortcuts", () => {
    const custom=source.replace('</ActionSet>', '<Action name="ToggleWeaponStance"><Trigger>B</Trigger></Action><Action name="ROTKConsole"><Trigger>F6</Trigger></Action></ActionSet>');
    const next=migrateStanceProfile(custom,true);
    expect(next.text).toBe(custom); expect(next.state.added).toEqual([]);
  });
  it("preserves the public console workaround across launcher updates", () => {
    const repaired = source.replace('</ActionSet>', '<Action name="ToggleWeaponStance" version="1"><Trigger>V</Trigger></Action><Action name="ROTKConsole" version="1" /></ActionSet>');
    const state = { added: ["ToggleWeaponStance", "ROTKConsole"], removedNetworkN: true };
    expect(migrateStanceProfile(repaired, true, state)).toEqual({ text: repaired, state });
  });
  it("rolls back only owned actions and restores N", () => {
    const installed=migrateStanceProfile(source,true);
    const restored=migrateStanceProfile(installed.text,false,installed.state);
    expect(restored.text.replace(/\s+/g,'')).toBe(source.replace(/\s+/g,''));
    expect(migrateStanceProfile(restored.text,false,restored.state)).toEqual(restored);
  });
  it("keeps player edits to other bindings during rollback", () => {
    const installed=migrateStanceProfile(source,true);
    const edited=installed.text.replace('<Trigger>M</Trigger>','<Trigger>J</Trigger>').replace('<Action name="ToggleNetworkStats"></Action>','<Action name="ToggleNetworkStats"><Trigger>F5</Trigger></Action>');
    const result=migrateStanceProfile(edited,false,installed.state);
    expect(result.text).toContain('<Trigger>J</Trigger>'); expect(result.text).toContain('<Trigger>F5</Trigger>');
    expect(result.text).not.toContain('<Trigger>N</Trigger>');
  });
});
