export default function ChildSafetyPage() {
  return (
    <div className="min-h-screen bg-white py-20 px-4">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Child Safety Standards</h1>
        <p className="text-gray-600 mb-6">Last updated: April 29, 2026</p>

        <div className="space-y-6 text-gray-700 leading-relaxed">
          <section>
            <h2 className="text-xl font-bold mb-3">Our Commitment</h2>
            <p>ConnectHub is committed to the safety and protection of children. Our platform is designed exclusively for adults aged 18 and above. We have zero tolerance for child sexual abuse and exploitation (CSAE) in any form on our platform.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">Age Restriction</h2>
            <p>ConnectHub strictly prohibits users under the age of 18 from creating accounts or using our services. We enforce age verification during the registration process and will immediately terminate any account found to belong to a minor.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">Prevention Measures</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Mandatory age verification during signup (users must be 18+)</li>
              <li>Profile verification through selfie liveness detection and ID document checks</li>
              <li>Automated and manual content moderation to detect and remove inappropriate content</li>
              <li>AI-based detection systems to identify and flag suspicious behavior</li>
              <li>Immediate account suspension for any violations related to child safety</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">Reporting Mechanisms</h2>
            <p>Users can report child safety concerns through the following channels:</p>
            <ul className="list-disc pl-6 space-y-2 mt-2">
              <li><strong>In-app reporting:</strong> Every profile and message has a Report button that allows users to flag content or behavior related to child safety</li>
              <li><strong>Email:</strong> <a href="mailto:support@connecthub.love" className="text-rose-600 underline">support@connecthub.love</a></li>
              <li><strong>Dedicated safety email:</strong> <a href="mailto:privacy@connecthub.love" className="text-rose-600 underline">privacy@connecthub.love</a></li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">Response Protocol</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>All reports related to child safety are treated as highest priority and reviewed within 24 hours</li>
              <li>Suspected CSAM (Child Sexual Abuse Material) is immediately removed and the account is permanently banned</li>
              <li>We report all confirmed cases to the National Center for Missing and Exploited Children (NCMEC) and relevant local authorities</li>
              <li>We cooperate fully with law enforcement investigations</li>
              <li>We preserve relevant evidence as required by law</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">Content Moderation</h2>
            <p>Our moderation team actively monitors the platform for any content that may involve minors. We use a combination of automated tools and human review to ensure swift detection and removal of prohibited content.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">Contact Information</h2>
            <p>For child safety concerns, please contact us immediately:</p>
            <ul className="list-disc pl-6 space-y-2 mt-2">
              <li>Email: <a href="mailto:support@connecthub.love" className="text-rose-600 underline">support@connecthub.love</a></li>
              <li>Privacy: <a href="mailto:privacy@connecthub.love" className="text-rose-600 underline">privacy@connecthub.love</a></li>
              <li>Website: <a href="https://connecthub.love" className="text-rose-600 underline">connecthub.love</a></li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">Compliance</h2>
            <p>ConnectHub complies with all applicable child safety laws and regulations worldwide, including but not limited to COPPA (Children's Online Privacy Protection Act), Google Play's child safety policies, and relevant regional laws regarding the protection of minors.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
