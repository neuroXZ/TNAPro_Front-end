import React from "react";
import { Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
} from "@/components/ui/card";

const page = () => {
  return (
    <div>
      <h2 className="text-2xl font-bold">Changelog</h2>
      <h4 className="text-lg font-bold">1.1.4</h4>
      <ul className="list-disc list-inside">
        <li>Rename all internal references from TabX to Metro Tabs</li>
        <li>Rename asset files to use metrotabs prefix</li>
        <li>Add docblocks for all PHP functions</li>
      </ul>
      <h4 className="text-lg font-bold">1.1.3</h4>
      <ul className="list-disc list-inside">
        <li>
          Use plugin_dir_path() and plugin_dir_url() for correct path/URL
          resolution
        </li>
        <li>Remove updater</li>
        <li>Shorten readme short description</li>
        <li>Add version and $in_footer to enqueued scripts and styles</li>
      </ul>
      <h4 className="text-lg font-bold">1.1.2</h4>
      <ul className="list-disc list-inside">
        <li>Fixed plugin name</li>
      </ul>
      <h4 className="text-lg font-bold">1.1.1</h4>
      <ul className="list-disc list-inside">
        <li>Fixed block registration</li>
      </ul>
      <h4 className="text-lg font-bold">1.1.0</h4>
      <ul className="list-disc list-inside">
        <li>First release</li>
      </ul>
    </div>
  );
};

export default page;
