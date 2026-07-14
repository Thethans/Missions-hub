interface MinistrySectionProps {
  ministry: string;
}

/** "The Ministry" overview paragraph at the top of the card body. */
export default function MinistrySection({ ministry }: MinistrySectionProps) {
  return (
    <>
      <h3 className="pm-sec-label">The Ministry</h3>
      <p className="pm-ministry">{ministry}</p>
    </>
  );
}
