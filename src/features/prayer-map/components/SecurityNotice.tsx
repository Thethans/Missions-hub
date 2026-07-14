/**
 * Shown at the top of a creative-access missionary's card body. Sets
 * expectations up front, before the visitor notices the vague location text
 * or missing photos and wonders why — matches how real agency sites handle
 * this (see Missionary.locationSensitive).
 */
export default function SecurityNotice() {
  return (
    <div className="pm-security-notice">
      <span className="pm-security-notice__icon" aria-hidden="true">
        🔒
      </span>
      <p className="pm-security-notice__text">
        This worker serves in a <strong>creative access country</strong>, where open ministry is
        restricted. Their names, photos, and exact location are withheld to protect them and the
        local believers they serve.
      </p>
    </div>
  );
}
