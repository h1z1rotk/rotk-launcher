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
static BYTE native_network_action[0x120];
static unsigned int query_calls;
static uintptr_t query_network(uintptr_t manager, uintptr_t b, uintptr_t c, uintptr_t d, uintptr_t e, uintptr_t f) {
    assert(manager); assert(b == 2 && c == 3 && d == 4 && e == 5 && f == 6);
    ++query_calls;
    return (uintptr_t)native_network_action;
}
int main(void) {
    BYTE *image = VirtualAlloc(NULL, 0x1200000, MEM_RESERVE | MEM_COMMIT, PAGE_READWRITE);
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
    /* Execute the actual wrapper using a synthetic native query. The public
     * action site must target the query thunk, not the gated debug path. */
    assert(STANCE_CONSOLE_CALL_RVA + 5 + (int32_t)0xff1ab34d == 0xefa39);
    stance_jump(image+0x11b81c0, (void *)(uintptr_t)query_network);
    assert(VirtualProtect(image+0x11b81c0,14,PAGE_EXECUTE_READ,&old));
    assert(FlushInstructionCache(GetCurrentProcess(),image+0x11b81c0,14));
    InterlockedExchange(&stance_enabled, 1);
    assert(stance_console((uintptr_t)manager,2,3,4,5,6)==(uintptr_t)native_network_action);
    BYTE console_action[0x190]={0};
    *(uintptr_t *)(console_action+8)=(uintptr_t)"ROTKConsole";
    *(uint32_t *)(console_action+0x10)=(uint32_t)strlen("ROTKConsole");
    table[stance_hash("ROTKConsole")&15]=(uintptr_t)console_action;
    assert(stance_console((uintptr_t)manager,2,3,4,5,6)==(uintptr_t)native_network_action);
    console_action[0x130]=1;
    assert(stance_console((uintptr_t)manager,2,3,4,5,6)==(uintptr_t)(console_action+0x18));
    native_network_action[0x118]=1;
    /* Both bindings pressed still select one action, hence one UI toggle. */
    assert(stance_console((uintptr_t)manager,2,3,4,5,6)==(uintptr_t)(console_action+0x18));
    console_action[0x130]=0;
    assert(stance_action_pressed((BYTE *)stance_console((uintptr_t)manager,2,3,4,5,6)));
    InterlockedExchange(&stance_enabled, 0); console_action[0x130]=1;
    assert(stance_console((uintptr_t)manager,2,3,4,5,6)==(uintptr_t)native_network_action);
    assert(query_calls==6);
    *(uintptr_t *)(context+0x88)=15; assert(!stance_action(manager,"ToggleWeaponStance"));
    VirtualFree(image,0,MEM_RELEASE);
    puts("PASS: setter, input registry, public console custom/native/both/disabled routing and corrupt table refusal.");
    return 0;
}
