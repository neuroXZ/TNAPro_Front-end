import React from 'react'
import Link from 'next/link'

const page = () => {
  return (
    <div className="p-4">
      <h1 className="text-3xl font-bold text-primary mb-4">Unit Type Documentation</h1>
      <p className="text-muted-foreground mb-6">
        Welcome to the Unit Type documentation. Here you will find all the information you need to understand and work with unit types in our system.
      </p>
      <h2 className="text-2xl font-semibold text-primary mb-3">What is a Unit Type?</h2>
      <p className="text-muted-foreground mb-6">
        A Unit Type is a classification that defines the characteristics and behavior of a unit in our system. It helps to categorize units based on their attributes and functionalities.
      </p>
      <h2 className="text-2xl font-semibold text-primary mb-3">Key Features</h2>
      <ul className="list-disc list-inside text-muted-foreground mb-6">
        <li>Customizable attributes for each unit type</li>
        <li>Support for hierarchical relationships between unit types</li>
        <li>Integration with other system components for seamless functionality</li>
      </ul>
      <h2 className="text-2xl font-semibold text-primary mb-3">Getting Started</h2>
      <p className="text-muted-foreground mb-6">
        To get started with unit types, you can create a new unit type by navigating to the Unit Type management page and clicking on the "Add Unit Type" button. From there, you can define the attributes and settings for your new unit type.
      </p>
      <h2 className="text-2xl font-semibold text-primary mb-3">Best Practices</h2>
      <p className="text-muted-foreground mb-6">
        When working with unit types, it's important to follow best practices to ensure consistency and maintainability. Here are some tips:
      </p>
      <ul className="list-disc list-inside text-muted-foreground mb-6">
        <li>Use descriptive names for unit types to clearly indicate their purpose</li>
        <li>Keep the number of unit types manageable to avoid confusion</li>
        <li>Regularly review and update unit types as needed to reflect changes in your system</li>
      </ul>
      <h2 className="text-2xl font-semibold text-primary mb-3">Additional Resources</h2>
      <p className="text-muted-foreground mb-6">
        For more information on unit types and how to use them effectively, please refer to the following resources:
      </p>
      <ul className="list-disc list-inside text-muted-foreground mb-6">
        <li><Link href="/admin/unittype/api" className="text-primary hover:underline">Unit Type API Documentation</Link></li>
        <li><Link href="/admin/unittype/examples" className="text-primary hover:underline">Unit Type Examples</Link></li>
        <li><Link href="/admin/unittype/faq" className="text-primary hover:underline">Unit Type FAQ</Link></li>
      </ul>
      <p className="text-muted-foreground">
        If you have any questions or need further assistance, please don't hesitate to reach out to our support team.
      </p>
    </div>
  )
}

export default page