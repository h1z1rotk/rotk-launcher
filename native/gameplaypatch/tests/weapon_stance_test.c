#define DirectInput8Create RotkTestDirectInput8Create
#define DllCanUnloadNow RotkTestDllCanUnloadNow
#define DllGetClassObject RotkTestDllGetClassObject
#define DllRegisterServer RotkTestDllRegisterServer
#define DllUnregisterServer RotkTestDllUnregisterServer
#define GetdfDIJoystick RotkTestGetdfDIJoystick
#define DllMain RotkTestDllMain
#include "../dinput8_proxy.c"
#undef NDEBUG
#include <assert.h>
int main(void) {
    BYTE *image = VirtualAlloc(NULL, 0x800000, MEM_RESERVE | MEM_COMMIT, PAGE_READWRITE);
    BYTE actor[0x1100] = {0}, vt[0x500] = {0}; DWORD old;
    const BYTE setter[] = {0x89,0x91,0xa0,0x09,0,0,0xc3};
    assert(image); stance_base=image;
    memcpy(image+0x7a2de,setter,sizeof(setter));
    assert(VirtualProtect(image+0x7a2de,sizeof(setter),PAGE_EXECUTE_READ,&old));
    assert(FlushInstructionCache(GetCurrentProcess(),image+0x7a2de,sizeof(setter)));
    *(uintptr_t *)actor=(uintptr_t)vt; *(uintptr_t *)(vt+0x4d8)=(uintptr_t)(image+0x7a2de);
    stance_set(actor,1); assert(stance_u32(actor+0x9a0)==1);
    stance_set(actor,0); assert(stance_u32(actor+0x9a0)==0);
    *(uintptr_t *)(vt+0x4d8)=(uintptr_t)(image+0x7a2dd);
    stance_set(actor,1); assert(stance_u32(actor+0x9a0)==0);
    BYTE manager[0x22d8]={0}, context[0xc0]={0}, action[0x190]={0}; uintptr_t table[16]={0};
    *(uintptr_t *)(manager+0x2d8+(stance_hash("Generic")&1023)*8)=(uintptr_t)context;
    *(uintptr_t *)(context+8)=(uintptr_t)"Generic"; *(uint32_t *)(context+0x10)=7;
    *(uintptr_t *)(context+0x80)=(uintptr_t)table; *(uintptr_t *)(context+0x88)=16;
    *(uintptr_t *)(action+8)=(uintptr_t)"ToggleWeaponStance";
    /* Derive the native string length, including all eighteen bytes. */
    *(uint32_t *)(action+0x10)=(uint32_t)strlen("ToggleWeaponStance");
    table[stance_hash("ToggleWeaponStance")&15]=(uintptr_t)action;
    assert(stance_action(manager,"ToggleWeaponStance")==action+0x18);
    assert(!stance_action_pressed(action+0x18)); action[0x130]=1;
    assert(stance_action_pressed(action+0x18)); assert(!stance_action(manager,"ROTKConsole"));
    *(uintptr_t *)(context+0x88)=15; assert(!stance_action(manager,"ToggleWeaponStance"));
    VirtualFree(image,0,MEM_RELEASE);
    puts("PASS: native virtual setter thunk, foreign target refusal, input registry, pressed bit and corrupt table refusal.");
    return 0;
}
