import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import React from "react";

const TermsAndConditionsPage = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <header className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-2">Terms & Conditions</h1>
        <h2 className="text-2xl font-semibold">and Privacy Policy</h2>
        <p className="text-lg text-gray-600 mt-4">
          Staff Management & Assessment System
        </p>
        <hr className="my-6" />
        <div className="flex justify-between text-sm text-gray-500">
          <span>Effective Date: 17 March 2026</span>
          <span>Version 1.0</span>
        </div>
      </header>

      <main>
        <Tabs defaultValue="terms">
          <TabsList className="bg-primary text-white rounded-md">
            <TabsTrigger value="terms" className="data-[state=inactive]:text-white data-[state=active]:text-black">Terms and Conditions</TabsTrigger>
            <TabsTrigger value="privacy" className="data-[state=inactive]:text-white data-[state=active]:text-black">Privacy Policy</TabsTrigger>
          </TabsList>
          <TabsContent value="terms">
            <section className="p-10">
              <h2 className="text-3xl font-bold mb-4">
                PART A — TERMS AND CONDITIONS OF USE
              </h2>

              <div className="mb-6">
                <h3 className="text-2xl font-semibold mb-2">1. Definitions</h3>
                <p>
                  <strong>&quot;System&quot;</strong> refers to the staff management and competency assessment
                  platform provided by the service provider.
                </p>
                <p>
                  <strong>&quot;Provider&quot;</strong> refers to the company or individual that develops,
                  maintains, and delivers the System.
                </p>
                <p>
                  <strong>&quot;Client&quot;</strong> refers to the organisation or company that subscribes to
                  and uses the System.
                </p>
                <p>
                  <strong>&quot;User&quot;</strong> refers to any individual granted access to the System,
                  including administrators and staff members.
                </p>
                <p>
                  <strong>&quot;Data&quot;</strong> refers to all information entered, processed, or stored
                  within the System, including personal information of staff
                  members.
                </p>
              </div>

              <div className="mb-6">
                <h3 className="text-2xl font-semibold mb-2">
                  2. Acceptance of Terms
                </h3>
                <p>
                  By using the System, the Client and Users agree to be bound by the
                  Terms and Conditions set out in this document. If the Client or
                  any User does not agree with any part of these terms, use of the
                  System must be discontinued immediately.
                </p>
              </div>

              <div className="mb-6">
                <h3 className="text-2xl font-semibold mb-2">
                  3. Licence and Access
                </h3>
                <p>
                  Access to the System is granted by the Provider to the Client on a
                  licence basis. This licence is:
                </p>
                <ul className="list-disc list-inside ml-4 mt-2">
                  <li>
                    Non-exclusive — the Provider reserves the right to grant similar
                    licences to other parties.
                  </li>
                  <li>
                    Non-transferable — the Client may not transfer the licence to
                    any third party without prior written consent from the Provider.
                  </li>
                  <li>
                    Limited to the number of users specified in the licence
                    agreement.
                  </li>
                  <li>
                    Subject to the duration and conditions agreed between the
                    Provider and the Client.
                  </li>
                </ul>
                <p className="mt-2">
                  The Provider reserves the right to revoke the licence if the
                  Client breaches any of the terms set out in this document.
                </p>
              </div>

              <div className="mb-6">
                <h3 className="text-2xl font-semibold mb-2">
                  4. Client Responsibilities
                </h3>
                <p>The Client is responsible for:</p>
                <ul className="list-disc list-inside ml-4 mt-2">
                  <li>
                    Ensuring all Users granted access to the System comply with
                    these Terms and Conditions.
                  </li>
                  <li>
                    Maintaining the confidentiality of login credentials (username
                    and password) and not sharing them with unauthorised parties.
                  </li>
                  <li>
                    Notifying the Provider immediately in the event of unauthorised
                    access or a security breach.
                  </li>
                  <li>
                    Ensuring that all information entered into the System is
                    accurate, complete, and up to date.
                  </li>
                  <li>
                    Obtaining all necessary consents from their staff before
                    entering personal data into the System.
                  </li>
                  <li>
                    Complying with all applicable laws and regulations, including
                    the Personal Data Protection Act 2010 (PDPA).
                  </li>
                </ul>
              </div>

              <div className="mb-6">
                <h3 className="text-2xl font-semibold mb-2">5. Prohibited Use</h3>
                <p>The Client and Users are strictly prohibited from:</p>
                <ul className="list-disc list-inside ml-4 mt-2">
                  <li>
                    Using the System for any unlawful purpose or activity that
                    violates ethical standards.
                  </li>
                  <li>
                    Attempting to access data belonging to other Clients or
                    unauthorised sections of the System.
                  </li>
                  <li>
                    Reverse engineering, copying, modifying, or distributing any
                    part of the System’s code.
                  </li>
                  <li>
                    Uploading content containing malware, viruses, or any malicious
                    code.
                  </li>
                  <li>
                    Using the System to send spam or unsolicited communications.
                  </li>
                  <li>
                    Misusing the email functionality for purposes other than
                    official staff management communications.
                  </li>
                </ul>
              </div>

              <div className="mb-6">
                <h3 className="text-2xl font-semibold mb-2">
                  6. System Availability
                </h3>
                <p>
                  The Provider will endeavour to ensure the System is available 24
                  hours a day, 7 days a week. However, the Provider does not
                  guarantee uninterrupted availability and reserves the right to
                  perform scheduled maintenance that may result in temporary
                  downtime. Reasonable advance notice will be provided for any
                  planned maintenance.
                </p>
              </div>

              <div className="mb-6">
                <h3 className="text-2xl font-semibold mb-2">
                  7. Limitation of Liability
                </h3>
                <p>
                  The System is provided on an &quot;as-is&quot; basis. The Provider shall not
                  be liable for:
                </p>
                <ul className="list-disc list-inside ml-4 mt-2">
                  <li>
                    Loss of data resulting from technical failures beyond the
                    Provider&apos;s control.
                  </li>
                  <li>
                    Service interruptions caused by third-party providers (hosting,
                    email delivery, image storage).
                  </li>
                  <li>
                    Indirect, incidental, or consequential damages arising from the
                    use of the System.
                  </li>
                  <li>
                    Actions or omissions by the Client or Users that violate these
                    Terms.
                  </li>
                </ul>
              </div>

              <div className="mb-6">
                <h3 className="text-2xl font-semibold mb-2">
                  8. Third-Party Services
                </h3>
                <p>
                  The System utilises third-party services for certain functions.
                  The Client acknowledges and agrees that:
                </p>
                <ul className="list-disc list-inside ml-4 mt-2">
                  <li>
                    Emails are sent via Resend (resend.com) — subject to Resend&apos;s
                    own terms and privacy policy.
                  </li>
                  <li>
                    Staff images are stored via Cloudinary (cloudinary.com) —
                    subject to Cloudinary&apos;s own terms and privacy policy.
                  </li>
                  <li>
                    The database is hosted on a cloud platform that adheres to
                    industry security standards.
                  </li>
                </ul>
                <p className="mt-2">
                  The Provider ensures that all third-party services used comply
                  with appropriate security standards; however, the Provider is not
                  responsible for policy changes or disruptions caused by those
                  third-party providers.
                </p>
              </div>

              <div className="mb-6">
                <h3 className="text-2xl font-semibold mb-2">
                  9. Intellectual Property
                </h3>
                <p>
                  All intellectual property rights relating to the System, including
                  source code, design, and documentation, are the exclusive property
                  of the Provider. The Client is granted only a limited right of use
                  as specified in the licence agreement. Data entered by the Client
                  into the System remains the property of the Client.
                </p>
              </div>

              <div className="mb-6">
                <h3 className="text-2xl font-semibold mb-2">10. Termination</h3>
                <p>This agreement may be terminated by:</p>
                <ul className="list-disc list-inside ml-4 mt-2">
                  <li>
                    The Client by providing 30 days&apos; written notice to the Provider.
                  </li>
                  <li>
                    The Provider with immediate effect in the event of a material
                    breach by the Client.
                  </li>
                  <li>Either party by mutual agreement.</li>
                </ul>
                <p className="mt-2">
                  Upon termination, the Provider will grant the Client a 30-day
                  period to export all their data before it is permanently deleted
                  from the system.
                </p>
              </div>

              <div className="mb-6">
                <h3 className="text-2xl font-semibold mb-2">
                  11. Amendments to Terms
                </h3>
                <p>
                  The Provider reserves the right to amend these Terms and
                  Conditions at any time. The Client will be notified at least 14
                  days before any amendments take effect via their registered email
                  address. Continued use of the System after the effective date of
                  any amendment constitutes acceptance of the revised terms.
                </p>
              </div>

              <div className="mb-6">
                <h3 className="text-2xl font-semibold mb-2">12. Governing Law</h3>
                <p>
                  These Terms and Conditions are governed by the laws of Malaysia.
                  Any disputes arising from or in connection with these Terms shall
                  be resolved through the courts of competent jurisdiction in
                  Malaysia.
                </p>
              </div>
            </section>
          </TabsContent>
          <TabsContent value="privacy">
            <section className="p-10">
              <h2 className="text-3xl font-bold mb-4">PART B — PRIVACY POLICY</h2>
              <p className="mb-4">
                This Privacy Policy explains how personal data is collected, used, stored, and protected within the System, in accordance with the Personal Data Protection Act 2010 (PDPA) of Malaysia.
              </p>

              <div className="mb-6">
                <h3 className="text-2xl font-semibold mb-2">1. Data Collection</h3>
                <p>The System collects personal information of staff members entered by the Client, including but not limited to:</p>
                <ul className="list-disc list-inside ml-4 mt-2">
                  <li>Identity information: full name, employee ID number.</li>
                  <li>Contact information: email address.</li>
                  <li>Employment information: position, unit, grade, supervisor.</li>
                  <li>Limited biometric data: profile photo (if uploaded).</li>
                  <li>Assessment data: scores, results, and competency assessment remarks.</li>
                  <li>Technical data: access logs, login timestamps, and in-system activity.</li>
                </ul>
              </div>

              <div className="mb-6">
                <h3 className="text-2xl font-semibold mb-2">2. Purpose of Data Processing</h3>
                <p>Personal data collected is used solely for the following purposes:</p>
                <ul className="list-disc list-inside ml-4 mt-2">
                  <li>Maintaining staff records and organisational information.</li>
                  <li>Executing and managing the competency assessment process.</li>
                  <li>Sending system-related communications such as password setup emails and assessment reminders.</li>
                  <li>Generating reports and analytics related to staff performance and competency.</li>
                  <li>Maintaining the security and integrity of the System.</li>
                </ul>
              </div>

              <div className="mb-6">
                <h3 className="text-2xl font-semibold mb-2">3. Roles in Data Processing</h3>
                <p>In the context of the PDPA 2010:</p>
                <ul className="list-disc list-inside ml-4 mt-2">
                  <li>The Client is the &quot;Data Controller&quot; — responsible for determining the purposes and means of processing the personal data of their staff.</li>
                  <li>The Provider is the &quot;Data Processor&quot; — processing data solely on the instructions of and on behalf of the Client.</li>
                </ul>
                <p className="mt-2">The Provider will not process the personal data of the Client’s staff for any purpose other than those stated in this Privacy Policy and the agreement between the Provider and the Client.</p>
              </div>

              <div className="mb-6">
                <h3 className="text-2xl font-semibold mb-2">4. Data Storage and Security</h3>
                <p>The Provider takes appropriate technical and organisational measures to protect personal data:</p>
                <ul className="list-disc list-inside ml-4 mt-2">
                    <li>Passwords are stored in hashed form using the bcrypt algorithm — the Provider cannot read original passwords.</li>
                    <li>Data communications are protected using HTTPS/TLS encryption.</li>
                    <li>Authentication tokens (JWT) are used for secure access control.</li>
                    <li>Data access is role-based — each user can only access data they are authorised to view.</li>
                    <li>Staff images are stored on Cloudinary with appropriate access controls in place.</li>
                </ul>
              </div>

              <div className="mb-6">
                <h3 className="text-2xl font-semibold mb-2">5. Data Sharing with Third Parties</h3>
                <p>Personal data processed within the System is shared with the following third parties solely for the purpose of operating the System:</p>
                <ul className="list-disc list-inside ml-4 mt-2">
                    <li>Resend (resend.com) — for the delivery of system emails. Data shared: recipient email address and related email content.</li>
                    <li>Cloudinary (cloudinary.com) — for the storage of staff images. Data shared: uploaded image files.</li>
                    <li>Database hosting service provider — for the storage of system records.</li>
                </ul>
                <p className="mt-2">The Provider does not sell, rent, or disclose personal data to any other party for marketing or commercial purposes.</p>
              </div>

              <div className="mb-6">
                <h3 className="text-2xl font-semibold mb-2">6. Rights of Data Subjects</h3>
                <p>Staff members whose data is processed in the System have the following rights under the PDPA 2010:</p>
                <ul className="list-disc list-inside ml-4 mt-2">
                    <li>The right to access their personal data stored in the System.</li>
                    <li>The right to correct inaccurate or incomplete personal data.</li>
                    <li>The right to request deletion of their data under certain circumstances.</li>
                    <li>The right to restrict the processing of their data under certain circumstances.</li>
                </ul>
                <p className="mt-2">Requests relating to these rights should be directed to the Client (respective employer) who is the Data Controller for that data.</p>
              </div>

              <div className="mb-6">
                <h3 className="text-2xl font-semibold mb-2">7. Cross-Border Data Transfers</h3>
                <p>Due to the use of third-party services such as Cloudinary and Resend, personal data may be stored and processed on servers located outside Malaysia. The Provider ensures that any such data transfers are made only to providers that comply with appropriate international data protection standards.</p>
              </div>

              <div className="mb-6">
                <h3 className="text-2xl font-semibold mb-2">8. Data Retention</h3>
                <p>Personal data is retained for the duration that the licence agreement between the Provider and the Client remains active. Upon termination of the agreement:</p>
                <ul className="list-disc list-inside ml-4 mt-2">
                    <li>The Client is given a 30-day period to export all their data.</li>
                    <li>After this period, data will be permanently deleted from the System and all related third-party services.</li>
                </ul>
              </div>

              <div className="mb-6">
                <h3 className="text-2xl font-semibold mb-2">9. Data Breach</h3>
                <p>In the event of a security breach involving personal data, the Provider will:</p>
                <ul className="list-disc list-inside ml-4 mt-2">
                    <li>Notify the Client within 72 hours of the Provider becoming aware of the breach.</li>
                    <li>Provide information regarding the known scope and impact of the breach.</li>
                    <li>Take immediate steps to contain and restore the security of the System.</li>
                </ul>
                <p className="mt-2">The Client, as Data Controller, is responsible for determining whether reporting to the Department of Personal Data Protection or to affected data subjects is required under the PDPA.</p>
              </div>

              <div className="mb-6">
                <h3 className="text-2xl font-semibold mb-2">10. Provider Access to Client Data</h3>
                <p>The Provider may need to access Client data in the following limited circumstances:</p>
                <ul className="list-disc list-inside ml-4 mt-2">
                    <li>At the Client’s request for the purpose of technical support.</li>
                    <li>To identify and resolve technical or security issues.</li>
                    <li>As required by law or court order.</li>
                </ul>
                <p className="mt-2">In all of the above situations, access will be limited to the minimum data necessary and will be logged for audit purposes.</p>
              </div>

              <div className="mb-6">
                <h3 className="text-2xl font-semibold mb-2">11. Cookies and Technical Data</h3>
                <p>The System may use session tokens and technical logs for the purposes of security and user authentication. This data is not used for commercial tracking or advertising purposes.</p>
              </div>

              <div className="mb-6">
                <h3 className="text-2xl font-semibold mb-2">12. Amendments to Privacy Policy</h3>
                <p>The Provider reserves the right to amend this Privacy Policy from time to time to reflect changes in privacy practices or legal requirements. The Client will be notified of any material amendments at least 14 days before they take effect.</p>
              </div>

              <div className="mb-6">
                <h3 className="text-2xl font-semibold mb-2">13. Contact Us</h3>
                <p>Should you have any questions or concerns regarding these Terms and Conditions or this Privacy Policy, please contact the Provider through the communication channels specified in your service agreement.</p>
              </div>
              <footer className="text-center mt-12 text-sm text-gray-500">
                <p>This document is effective as of 17 March 2026</p>
                <p>Version 1.0 — All Rights Reserved</p>
              </footer>
            </section>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default TermsAndConditionsPage;
