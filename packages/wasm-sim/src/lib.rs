// packages/wasm-sim/src/lib.rs
use wasm_bindgen::prelude::*;

static mut TICK: u32 = 0;
static mut SEED: u32 = 0;
static mut HZ: u32 = 60;

#[wasm_bindgen]
pub fn init(seed: u32, hz: u32) {
    unsafe {
        SEED = seed;
        HZ = if hz == 0 { 60 } else { hz };
        TICK = 0;
    }
}

#[wasm_bindgen]
pub fn current_tick() -> u32 {
    unsafe { TICK }
}

#[wasm_bindgen]
pub fn step(_inputs_ptr: u32, _len: u32) {
    // TODO: parse inputs from memory at inputs_ptr
    unsafe { TICK = TICK.wrapping_add(1); }
}

#[wasm_bindgen]
pub fn snapshot(out_ptr: u32) -> u32 {
    // tiny binary: [u32 tick][u32 seed]
    let buf = [
        unsafe { TICK }.to_le_bytes(),
        unsafe { SEED }.to_le_bytes()
    ].concat();
    unsafe {
        let mem = wasm_bindgen::memory()
            .unchecked_into::<js_sys::WebAssembly::Memory>();
        let arr = js_sys::Uint8Array::new(&mem.buffer());
        arr.set(&js_sys::Uint8Array::from(buf.as_slice()), out_ptr);
    }
    8
}