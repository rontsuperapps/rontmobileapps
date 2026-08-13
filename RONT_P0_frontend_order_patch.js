/*
 * RONT MOBILE APPS - P0 FRONTEND PATCH
 *
 * Tujuan:
 * 1. Menghilangkan double request orderData saat Search No Inet.
 * 2. Menyimpan hasil lookup pertama ke orderState.currentRow.
 * 3. Form Update menggunakan hasil lookup tersebut.
 *
 * SERVICE WORKER:
 * Tidak perlu diubah untuk P0.
 */

function searchOrderByNoInet() {
  const session = getSession();

  if (!session) {
    showToast('error', 'Silakan Login terlebih dahulu.');
    goTo('login');
    return;
  }

  const noInet = document
    .getElementById('dashSearchNoInet')
    .value
    .trim();

  if (!noInet) {
    showToast('error', 'Masukkan No Inet terlebih dahulu.');
    return;
  }

  setLoading(
    'btnDashSearch',
    'dashSearchSpinner',
    'dashSearchBtnText',
    'Mencari...'
  );

  apiGet({
    action: 'orderData',
    nik: session.nik,
    telegramId: session.telegramId,
    noInet: noInet
  })
  .then(res => {

    resetLoading(
      'btnDashSearch',
      'dashSearchSpinner',
      'dashSearchBtnText',
      'Cari Order'
    );

    if (!res.success) {
      showToast(
        'error',
        res.message ||
        'Order dengan No Inet "' + noInet + '" tidak ditemukan.'
      );
      return;
    }

    /*
     * Simpan hasil lookup pertama.
     * Jangan lakukan orderData kedua.
     */
    orderState.currentNoInet = noInet;
    orderState.currentRow = res.data;

    document.getElementById('dashSearchNoInet').value = '';

    /*
     * Gunakan renderer existing.
     *
     * PENTING:
     * Jika fungsi openUpdate() Anda sekarang selalu melakukan
     * apiGet(orderData), jangan panggil openUpdate(noInet) di sini.
     */
    openUpdateFromCurrentRow(noInet);

  })
  .catch(err => {

    resetLoading(
      'btnDashSearch',
      'dashSearchSpinner',
      'dashSearchBtnText',
      'Cari Order'
    );

    showToast(
      'error',
      'Error: ' + err.message
    );
  });
}


/*
 * Renderer dari data yang SUDAH diperoleh.
 *
 * Prinsip:
 * currentRow sudah diambil oleh searchOrderByNoInet().
 * Tidak boleh melakukan apiGet(orderData) lagi di sini.
 */
function openUpdateFromCurrentRow(noInet) {

  const d = orderState.currentRow;

  if (!d) {
    showToast(
      'error',
      'Data Order belum tersedia. Silakan coba lagi.'
    );
    return;
  }

  orderState.currentNoInet = noInet;

  /*
   * Pindah ke halaman Update.
   */
  goTo('orderUpdate');

  /*
   * ============================================================
   * RENDER DATA ORDER
   * ============================================================
   *
   * Gunakan ID element yang sama dengan index.html Anda.
   *
   * Jika pada index.html nama ID berbeda, pertahankan ID existing
   * dan hanya gunakan d.xxx sebagai sumber datanya.
   */

  const elNoInet =
    document.getElementById('updNoInet');

  if (elNoInet) {
    elNoInet.textContent =
      d.noInet || noInet;
  }

  const elNama =
    document.getElementById('updNamaPelanggan');

  if (elNama) {
    elNama.value =
      d.namaPelanggan || '';
  }

  const elAlamat =
    document.getElementById('updAlamat');

  if (elAlamat) {
    elAlamat.value =
      d.alamat || '';
  }

  const elNomorHp =
    document.getElementById('updNomorHp');

  if (elNomorHp) {
    elNomorHp.value =
      d.nomorHp || '';
  }

  const elKoordinat =
    document.getElementById('updKoordinatPelanggan');

  if (elKoordinat) {
    elKoordinat.value =
      d.koordinatPelanggan || '';
  }

  const elStatusPelanggan =
    document.getElementById('updStatusPelanggan');

  if (elStatusPelanggan) {
    elStatusPelanggan.value =
      d.statusPelanggan || '';
  }

  const elPaketSpeed =
    document.getElementById('updPaketSpeed');

  if (elPaketSpeed) {
    elPaketSpeed.value =
      d.paketSpeed || '';
  }

  const elTargetOnt =
    document.getElementById('updTargetProdukOnt');

  if (elTargetOnt) {
    elTargetOnt.value =
      d.targetProdukOnt || '';
  }

  /*
   * Data tambahan.
   */
  const elTiket =
    document.getElementById('updTiketIdTactical');

  if (elTiket) {
    elTiket.textContent =
      d.tiketIdTactical || '-';
  }

  const elManjaDate =
    document.getElementById('updManjaDatePicker');

  if (elManjaDate) {
    elManjaDate.value =
      d.manjaDate || '';
  }

  const elJamManja =
    document.getElementById('updJamManjaPicker');

  if (elJamManja) {
    elJamManja.value =
      d.jamManja || '';
  }

  const elSnLama =
    document.getElementById('updSnOntLama');

  if (elSnLama) {
    elSnLama.value =
      d.snOntLama || '';
  }

  const elSnBaru =
    document.getElementById('updSnOntBaru');

  if (elSnBaru) {
    elSnBaru.value =
      d.snOntBaru || '';
  }

  const elValins =
    document.getElementById('updValinsId');

  if (elValins) {
    elValins.value =
      d.valinsId == null
        ? ''
        : d.valinsId;
  }

  const elKeteranganClose =
    document.getElementById('updKeteranganClose');

  if (elKeteranganClose) {
    elKeteranganClose.value =
      d.keteranganDispatch || '';
  }

  /*
   * Jangan menghapus logic UI existing Anda:
   *
   * - MANJA
   * - KENDALA
   * - KENDALA LAIN
   * - CLOSE
   * - show/hide field
   * - validation
   *
   * Logic tersebut tetap dipertahankan dari openUpdate()
   * existing Anda.
   */

  if (typeof validateUpdateForm === 'function') {
    validateUpdateForm();
  }
}
